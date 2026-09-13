from enum import Enum
from datetime import datetime, timezone
from app.models.schemas import EmergencyState, AuditLogEntry

class LifeOSState(str, Enum):
    NORMAL = "NORMAL"
    SUSPICIOUS = "SUSPICIOUS"
    CONFIRMATION = "CONFIRMATION"
    ACTIVE = "ACTIVE_EMERGENCY"
    DISPATCHED = "DISPATCHED"
    RE_PLANNING = "RE_PLANNING"
    RESOLVED = "RESOLVED"

def transition_state(current_state: EmergencyState, new_status: str, note: str) -> EmergencyState:
    if current_state.status != new_status:
        current_state.status = new_status
        current_state.plan_version += 1
        ts = datetime.now(timezone.utc).isoformat()
        current_state.timeline.append(AuditLogEntry(timestamp=ts, event=f"State transition to {new_status}: {note}"))
    return current_state
