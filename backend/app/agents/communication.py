from app.models.schemas import StakeholderPayloads, EmergencyState

def generate_payloads(state: EmergencyState, hospital_name: str, eta: int) -> StakeholderPayloads:
    return StakeholderPayloads(
        victim_ui="Assistance dispatched. Keep still.",
        family=f"Incident verified. AMB-04 en route to {hospital_name}. ETA {eta} min. Real-time tracking active.",
        responder=f"CRITICAL ALERT: {state.telemetry.impact_g}G impact detected. Victim unresponsive. Severe extrication risk. Optimum corridor mapped.",
        hospital_emr=f"INBOUND TRAUMA: {state.telemetry.impact_g}G lateral impact, GCS triage hypothesis severe. Prepare Level-1 surgical bay. ETA {eta} mins."
    )
