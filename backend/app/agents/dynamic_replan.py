"""Dynamic Re-planning Agent.

Intercepts hospital gridlock events in real time: marks the facility
``CAPACITY_ZERO`` in the live registry, re-scores the remaining facilities
with the gridlocked hospital excluded, and produces a *Plan v2* allocation
with fresh corridor geometry for the tactical map.

Everything here is synchronous pure logic (the orchestrator wraps it in an
``asyncio`` lock and broadcasts atomically).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.agents.resource_matcher import (
    build_route,
    build_rationale,
    score_hospitals,
    select_best,
)
from app.models.schemas import Allocation, CandidateScore, EmergencyState, LifeOSState

# Corridor archetype cards shown to the EMR during re-plans.
GRIDLOCK = "GRIDLOCK"
CAPACITY_ZERO = "CAPACITY_ZERO"
REROUTED = "REROUTED"


@dataclass
class ReplanResult:
    """Outcome of one gridlock event."""

    previous_hospital_id: str
    previous_hospital_name: str
    locked_candidate: Optional[CandidateScore]
    candidates: List[CandidateScore] = field(default_factory=list)
    allocation: Optional[Allocation] = None


def register_gridlock(
    registry: Dict[str, Dict[str, Any]],
    hospital_id: str,
) -> Dict[str, Any]:
    """Flips a facility to zero capacity in the *live* registry.

    The seed file is untouched — capacity is mutated only in memory so a reset
    can restore the baseline.
    """
    hospital = registry.get(hospital_id)
    if hospital is None:
        raise KeyError(f"Unknown hospital id: {hospital_id}")
    hospital["icu_beds_free"] = 0
    hospital["status"] = GRIDLOCK
    return hospital


def handle_gridlock(
    state: EmergencyState,
    registry: Dict[str, Dict[str, Any]],
    gridlock_hospital_id: str,
    ambulance_id: str = "AMB-04",
) -> ReplanResult:
    """React to a hospital gridlock event and lock Plan v2.

    Assumes the caller has already transitioned the FSM into
    ``RE_PLANNING`` (which bumps ``plan_version``).
    """
    previous = registry.get(gridlock_hospital_id)
    if previous is None:
        raise KeyError(f"Unknown hospital id: {gridlock_hospital_id}")

    previous_name: str = previous.get("name", gridlock_hospital_id)
    register_gridlock(registry, gridlock_hospital_id)

    candidates = score_hospitals(
        incident_lat=state.telemetry.lat,
        incident_lng=state.telemetry.lng,
        requires_trauma=state.triage.requires_trauma,
        hospitals=list(registry.values()),
        exclude_ids=[gridlock_hospital_id],
    )
    best = select_best(candidates)

    if best is None:
        state.add_ledger(
            event="REPLAN.FAILURE",
            message="No surviving facility after gridlock exclusion — EMR override required",
            data={"excluded": gridlock_hospital_id},
        )
        state.status = LifeOSState.RE_PLANNING
        state.touch()
        return ReplanResult(
            previous_hospital_id=gridlock_hospital_id,
            previous_hospital_name=previous_name,
            locked_candidate=None,
            candidates=candidates,
        )

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
        hospital_status=REROUTED,
        plan_version=state.plan_version,
        rationale=build_rationale(best),
        candidates=candidates,
        route=route,
    )
    state.allocation = allocation
    state.add_ledger(
        event="REPLAN.LOCKED",
        message=(
            f"Dynamic re-plan v{state.plan_version}: {previous_name} dropped "
            f"(gridlock) -> {best.name} locked, ETA {best.eta_minutes} min"
        ),
        data={
            "plan_version": state.plan_version,
            "dropped": previous_name,
            "locked": best.name,
            "eta_minutes": best.eta_minutes,
            "route_segments": len(route),
        },
    )
    state.touch()
    return ReplanResult(
        previous_hospital_id=gridlock_hospital_id,
        previous_hospital_name=previous_name,
        locked_candidate=best,
        candidates=candidates,
        allocation=allocation,
    )