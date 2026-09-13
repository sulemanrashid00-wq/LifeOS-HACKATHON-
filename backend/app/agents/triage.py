"""Triage Agent — evaluates the vocal challenge window, clinical severity and
the evidence chain, and produces the authoritative assessment.

Hard requirement: the live demo must **never freeze** on an LLM. Therefore:

1. The deterministic :mod:`app.fallback_engine` decision is computed FIRST.
2. If configured, the LLM path runs concurrently with a hard timeout capped at
   1.8s; on timeout/error the deterministic decision is returned unmodified,
   tagged ``DETERMINISTIC_FALLBACK``.
"""

from __future__ import annotations

import json
from typing import Optional

import httpx

from app.config import get_settings
from app.fallback_engine import TriageDecision, deterministic_triage, gcs_hypothesis_for
from app.models.schemas import (
    EmergencyState,
    EvidenceDatum,
    TriageAssessment,
)

_MAX_LLM_TIMEOUT_S = 1.8  # hard cap required by the spec


# --------------------------------------------------------------------------- #
# Vocal challenge logic
# --------------------------------------------------------------------------- #


def start_challenge(state: EmergencyState, timeout_s: float) -> None:
    """Open the vocal-challenge window (victim has ``timeout_s`` to respond)."""
    state.triage = state.triage.model_copy(
        update={
            "victim_responsive": True,
            "challenge_timeout_s": timeout_s,
        }
    )
    state.add_ledger(
        event="CHALLENGE.START",
        message="10s vocal challenge emitted — awaiting victim response",
        data={"timeout_s": timeout_s},
    )
    state.touch()


def resolve_challenge(
    state: EmergencyState,
    responded: bool,
    timeout_s: float,
) -> EmergencyState:
    """Close the challenge window with an explicit verdict."""
    state.triage = state.triage.model_copy(update={"victim_responsive": responded})
    state.add_ledger(
        event="CHALLENGE.RESOLUTION",
        message=(
            "Victim responded"
            if responded
            else "Victim failed to respond before challenge deadline"
        ),
        data={"responded": responded, "elapsed_s": timeout_s},
    )
    state.touch()
    return state


# --------------------------------------------------------------------------- #
# Optional LLM refinement (bounded, fail-open)
# --------------------------------------------------------------------------- #


def _extract_json(text: str) -> Optional[dict]:
    """Tolerantly peel JSON out of polite LLM prose."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            return None
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None


async def _llm_refine(
    state: EmergencyState,
    base: TriageDecision,
) -> Optional[TriageAssessment]:
    """Best-effort LLM refinement. Returns ``None`` on any failure.

    The call is bounded by ``min(settings.llm_timeout_s, _MAX_LLM_TIMEOUT_S)``.
    """
    settings = get_settings()
    if not settings.llm_enabled:
        return None

    timeout = min(settings.llm_timeout_s, _MAX_LLM_TIMEOUT_S)
    prompt = {
        "model": settings.llm_model,
        "temperature": 0.0,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are the LIFEOS clinical triage arbiter. Given raw "
                    "telemetry return a JSON object with exactly the keys: "
                    "severity, confidence, requires_trauma, "
                    "requires_extrication, gcs_hypothesis."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "impact_g": state.telemetry.impact_g,
                        "decibel_level": state.telemetry.decibel_level,
                        "speed_kmh": state.telemetry.speed_kmh,
                        "camera": state.telemetry.camera.model_dump(),
                        "baseline": base.__dict__,
                    }
                ),
            },
        ],
        "max_tokens": 200,
    }

    url = settings.llm_base_url.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {settings.llm_api_key}"}
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, headers=headers, json=prompt)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            parsed = _extract_json(content)
            if parsed is None:
                return None
            return TriageAssessment(
                severity=parsed.get("severity", base.severity),
                confidence=float(parsed.get("confidence", base.confidence)),
                victim_responsive=state.triage.victim_responsive,
                challenge_timeout_s=state.triage.challenge_timeout_s,
                requires_trauma=bool(
                    parsed.get("requires_trauma", base.requires_trauma)
                ),
                requires_extrication=bool(
                    parsed.get("requires_extrication", base.requires_extrication)
                ),
                gcs_hypothesis=parsed.get("gcs_hypothesis", base.gcs_hypothesis)
                or gcs_hypothesis_for(state.telemetry.impact_g),
                inference_source="LLM",
                reasons=["LLM refinement path acknowledged"],
            )
    except (httpx.HTTPError, KeyError, ValueError, json.JSONDecodeError):
        return None  # fail-open: deterministic decision stands


# --------------------------------------------------------------------------- #
# Public orchestration entry point
# --------------------------------------------------------------------------- #


def _bundle_deterministic(
    state: EmergencyState,
    base: TriageDecision,
) -> TriageAssessment:
    """Build the assessment object from the deterministic decision + audit."""
    state.evidence.inferred.append(
        EvidenceDatum(
            source="inferred",
            sensor="triage",
            message=f"Routed via deterministic path: severity={base.severity}",
        )
    )
    return TriageAssessment(
        severity=base.severity,  # valid Literal member by construction
        confidence=base.confidence,
        victim_responsive=state.triage.victim_responsive,
        challenge_timeout_s=state.triage.challenge_timeout_s,
        requires_trauma=base.requires_trauma,
        requires_extrication=base.requires_extrication,
        gcs_hypothesis=base.gcs_hypothesis,
        inference_source="DETERMINISTIC_FALLBACK",
        reasons=base.reasons,
    )


async def assess_emergency(state: EmergencyState) -> TriageAssessment:
    """Produce the authoritative triage assessment.

    1. Deterministic decision computed synchronously (sub-10ms).
    2. LLM refinement attempted within the hard cap; if absent or timed out,
       the deterministic decision is locked in — the demo never freezes.
    """
    base = deterministic_triage(state)
    if get_settings().llm_enabled:
        refined = await _llm_refine(state, base)
        if refined is not None:
            state.evidence.inferred.append(
                EvidenceDatum(
                    source="inferred",
                    sensor="triage/llm",
                    message=(
                        f"LLM arbitration path: {refined.severity} "
                        f"conf={refined.confidence:.2f}"
                    ),
                )
            )
            state.triage = refined
        else:
            state.triage = _bundle_deterministic(state, base)
    else:
        state.triage = _bundle_deterministic(state, base)
    state.touch()
    return state.triage