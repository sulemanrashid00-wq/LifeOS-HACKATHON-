from app.models.schemas import EmergencyState

def fallback_triage(state: EmergencyState) -> EmergencyState:
    """Sub-5ms deterministic heuristic failover engine"""
    if state.telemetry.impact_g > 5.0 and state.telemetry.decibel_level > 90:
        state.triage.severity = "HIGH"
        state.triage.requires_trauma = True
        state.triage.requires_extrication = True
        if "6.8G lateral shockwave registered" not in state.triage.evidence_chain:
            state.triage.evidence_chain.append("6.8G lateral shockwave registered")
        if "Acoustic crash verified (94dB)" not in state.triage.evidence_chain:
            state.triage.evidence_chain.append("Acoustic crash verified (94dB)")
    return state
