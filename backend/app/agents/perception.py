"""Perception Agent — fuses IMU, audio decibels and camera flags.

Turns raw multimodal telemetry into an *anomaly report*. The critical design
constraint: **observations are appended to ``EvidenceArray.observed`` before
any inference is run**, so the audit trail always separates what the sensors
physically said from what the system hypothesized.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

from app.config import get_settings
from app.models.schemas import (
    CameraFlags,
    EmergencyState,
    EvidenceArray,
    EvidenceDatum,
    Telemetry,
    now_utc,
)


@dataclass
class AnomalyReport:
    """Structured verdict of the perception pass.

    Fields prefixed ``raw_`` are pure observations; ``shockwave_flagged`` and
    the breakdown table are derived hypotheses.
    """

    shockwave_flagged: bool
    acoustic_flagged: bool
    vision_flagged: bool
    raw_impact_g: float
    raw_decibel: float
    raw_camera: CameraFlags
    severity_hint: str
    observed_evidence: List[EvidenceDatum] = field(default_factory=list)


def analyze_telemetry(telemetry: Telemetry) -> AnomalyReport:
    """Synchronous, allocation-light anomaly detection over one telemetry frame.

    Timing is bounded by construction: O(1) sensor reads + threshold compares.
    """
    settings = get_settings()
    now = now_utc()
    evidence: List[EvidenceDatum] = []

    # --- raw observations (latest frame) ------------------------------------ #
    evidence.append(
        EvidenceDatum(
            ts=now,
            source="observed",
            sensor="imu",
            message=(
                f"IMU frame: {telemetry.impact_g:5.2f}G | "
                f"{telemetry.speed_kmh:5.1f}km/h | "
                f"pitch {telemetry.pitch_deg:+.1f} | roll {telemetry.roll_deg:+.1f}"
            ),
        )
    )
    evidence.append(
        EvidenceDatum(
            ts=now,
            source="observed",
            sensor="audio",
            message=f"Cabin acoustics: {telemetry.decibel_level:.1f} dB",
        )
    )
    evidence.append(
        EvidenceDatum(
            ts=now,
            source="observed",
            sensor="camera",
            message=(
                f"Vision flags: occupant_visible={telemetry.camera.occupant_visible}, "
                f"airbag_deployed={telemetry.camera.airbag_deployed}, "
                f"structural_damage={telemetry.camera.structural_damage}"
            ),
        )
    )

    # --- derived flags ------------------------------------------------------- #
    shockwave = telemetry.impact_g >= settings.crash_g_threshold
    acoustic = telemetry.decibel_level >= settings.crash_db_threshold
    vision = not (
        telemetry.camera.occupant_visible
        and not telemetry.camera.airbag_deployed
        and not telemetry.camera.structural_damage
    )

    if shockwave:
        evidence.append(
            EvidenceDatum(
                ts=now_utc(),
                source="inferred",
                sensor="perception",
                message=(
                    f"Shockwave anomaly confirmed: {telemetry.impact_g:.2f}G "
                    f"exceeds {settings.crash_g_threshold:.1f}G threshold"
                ),
            )
        )
    if acoustic:
        evidence.append(
            EvidenceDatum(
                ts=now_utc(),
                source="inferred",
                sensor="perception",
                message=(
                    f"Acoustic crash fingerprint verified: {telemetry.decibel_level:.1f} dB"
                ),
            )
        )
    if vision:
        evidence.append(
            EvidenceDatum(
                ts=now_utc(),
                source="inferred",
                sensor="perception",
                message="Vision corroboration: cabin integrity / occupant presence risk",
            )
        )

    severity = "NEGLIGIBLE"
    if shockwave and (acoustic or vision):
        severity = "CRITICAL"
    elif shockwave or (acoustic and vision):
        severity = "HIGH"
    elif acoustic or vision:
        severity = "MEDIUM"

    return AnomalyReport(
        shockwave_flagged=shockwave,
        acoustic_flagged=acoustic,
        vision_flagged=vision,
        raw_impact_g=telemetry.impact_g,
        raw_decibel=telemetry.decibel_level,
        raw_camera=telemetry.camera,
        severity_hint=severity,
        observed_evidence=evidence[:3],  # raw-only rows
    )


def ingest_telemetry(
    state: EmergencyState,
    telemetry: Telemetry,
) -> AnomalyReport:
    """Bind a new telemetry frame into the authoritative state.

    Appends the raw observation rows to ``evidence.observed``, keeps the
    inferred perception rows in ``evidence.inferred``, and returns the report
    for the orchestration layer to act on.
    """
    state.telemetry = telemetry
    report = analyze_telemetry(telemetry)

    observed = list(state.evidence.observed)
    for entry in report.observed_evidence:
        observed.append(entry)
    # Bound the raw trail — 200 frames keeps the ledger compact for a live demo.
    state.evidence = EvidenceArray(
        observed=observed[-200:],
        inferred=state.evidence.inferred,
    )
    state.add_ledger(
        event="SENSOR.FRAME",
        message=(
            f"Telemetry frame fused: {telemetry.impact_g:.2f}G / "
            f"{telemetry.decibel_level:.1f}dB"
        ),
        data={
            "impact_g": round(telemetry.impact_g, 3),
            "decibel": round(telemetry.decibel_level, 1),
            "speed_kmh": round(telemetry.speed_kmh, 1),
            "sensor_alive": telemetry.sensor_alive,
        },
    )
    state.touch()
    return report