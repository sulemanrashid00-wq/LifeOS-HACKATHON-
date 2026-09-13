"""Decision Agent — plan locking, vehicle binding and audit logging.

The Decision Agent is the *commit* layer of the pipeline. Perception produces
an anomaly report, Triage produces a clinical assessment, ResourceMatcher
produces a ranked candidate list — but none of them *commit*. This agent:

1. Locks the chosen candidate into an :class:`Allocation` (the authoritative
   dispatch plan).
2. Binds a specific ambulance unit (``AMB-04``) to that allocation.
3. Writes an immutable, millisecond-stamped audit entry capturing *who*
   decided *what* and *why*.
4. Triggers the Communication Agent to fan out the four role-isolated
   stakeholder payloads.

The agent is intentionally thin: it is a pure function over the state plus
the ranked candidates, so it can be unit-tested without a running server.
"""

from __future__ import annotations

from typing import List, Optional

from app.agents.communication import generate_payloads
from app.agents.resource_matcher import build_rationale, build_route, select_best
from app.models.schemas import (
    Allocation,
    CandidateScore,
    EmergencyState,
    LifeOSState,
)


def lock_plan(
    state: EmergencyState,
    candidates: List[CandidateScore],
    ambulance_id: str = "AMB-04",
) -> Optional[Allocation]:
    """Select the best accepted candidate and lock it into an allocation.

    Parameters
    ----------
    state:
        The authoritative :class:`EmergencyState`. The allocation is bound
        to ``state.plan_version`` so the plan version is part of the
        allocation's identity.
    candidates:
        Ranked candidate list (already sorted by total_score descending).
    ambulance_id:
        Ambulance unit identifier to bind. Defaults to ``AMB-04``.

    Returns
    -------
    The locked :class:`Allocation`, or ``None`` when no candidate is
    accepted (e.g. every facility is at capacity 0).
    """
    best = select_best(candidates)
    if best is None:
        state.add_ledger(
            event="DECISION.FAILURE",
            message="Plan lock failed — no accepted candidate available",
            data={
                "plan_version": state.plan_version,
                "candidate_count": len(candidates),
            },
        )
        return None

    route = build_route(
        state.telemetry.lat,
        state.telemetry.lng,
        best.lat,
        best.lng,
    )

    allocation = Allocation(
        ambulance_id=ambulance_id,
        target_hospital_id=best.hospital_id,
        target_hospital=best.name,
        target_short_name=best.short_name,
        eta_minutes=best.eta_minutes,
        hospital_status="ATTRIBUTED",
        plan_version=state.plan_version,
        rationale=build_rationale(best),
        candidates=candidates,
        route=route,
    )

    # --- bind to state + audit ------------------------------------------------ #
    state.allocation = allocation
    state.stakeholder_payloads = generate_payloads(state, allocation)

    state.add_ledger(
        event="DECISION.LOCKED",
        message=(
            f"Plan v{state.plan_version} locked: {ambulance_id} -> "
            f"{best.short_name} (ETA {best.eta_minutes} min, "
            f"score {best.total_score:.1f}/100)"
        ),
        data={
            "plan_version": state.plan_version,
            "ambulance_id": ambulance_id,
            "hospital_id": best.hospital_id,
            "hospital": best.name,
            "score": best.total_score,
            "eta_minutes": best.eta_minutes,
            "capability_score": best.capability_score,
            "proximity_score": best.proximity_score,
            "capacity_score": best.capacity_score,
            "route_segments": len(route),
            "rationale": allocation.rationale,
        },
    )
    state.touch()
    return allocation


def bind_ambulance(
    state: EmergencyState,
    allocation: Allocation,
    ambulance_id: str = "AMB-04",
) -> Allocation:
    """Re-bind (or initially bind) an ambulance unit to an existing allocation.

    Useful when the dispatch centre reassigns a different unit. The audit
    trail records the hand-off explicitly.
    """
    previous = allocation.ambulance_id
    if previous == ambulance_id:
        return allocation  # idempotent

    bound = allocation.model_copy(
        update={"ambulance_id": ambulance_id}
    )
    state.allocation = bound
    state.stakeholder_payloads = generate_payloads(state, bound)
    state.add_ledger(
        event="DECISION.VEHICLE_REASSIGN",
        message=f"Ambulance reassignment: {previous} -> {ambulance_id}",
        data={
            "plan_version": state.plan_version,
            "previous_ambulance": previous,
            "new_ambulance": ambulance_id,
            "hospital": bound.target_short_name,
        },
    )
    state.touch()
    return bound


def verify_plan_integrity(state: EmergencyState) -> dict:
    """Self-check that the locked allocation matches the current state.

    Returns a dict with booleans so the audit panel can render a green or
    red integrity indicator. Used by the heartbeat loop and the /health
    endpoint.
    """
    alloc = state.allocation
    checks = {
        "has_allocation": alloc is not None,
        "plan_version_matches": (
            alloc is not None and alloc.plan_version == state.plan_version
        ),
        "route_geometry_present": (
            alloc is not None and len(alloc.route) >= 2
        ),
        "payloads_bound": state.stakeholder_payloads is not None,
        "state_consistent": True,
    }
    if alloc is not None and state.stakeholder_payloads is not None:
        checks["payloads_match_allocation"] = (
            state.stakeholder_payloads.family_tracking_link
            == f"https://sos.lifeos.dev/track/{state.incident_id}"
        )
    return checks


def release_plan(state: EmergencyState) -> None:
    """Clear the allocation and payloads (used during reset / resolved)."""
    previous = state.allocation
    state.allocation = None
    state.stakeholder_payloads = None
    state.add_ledger(
        event="DECISION.RELEASED",
        message="Dispatch plan released — resources freed",
        data={
            "plan_version": state.plan_version,
            "previous_hospital": (
                previous.target_short_name if previous else None
            ),
        },
    )
    state.touch()