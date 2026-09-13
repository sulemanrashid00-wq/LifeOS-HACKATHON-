import json
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import EmergencyState, Telemetry, TriageAssessment, Allocation, StakeholderPayloads, AuditLogEntry
from app.state_machine import transition_state, LifeOSState
from app.agents.resource_matcher import score_and_match
from app.agents.communication import generate_payloads
from app.fallback_engine import fallback_triage
from app.persistence import init_db, log_transition

app = FastAPI(title="LIFEOS Engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

HOSPITALS_FILE = Path(__file__).parent / "data" / "hospitals.json"
with open(HOSPITALS_FILE) as f:
    hospitals_db = json.load(f)

# Initialize Database
init_db()

def get_initial_state():
    ts = datetime.now(timezone.utc).isoformat()
    return EmergencyState(
        incident_id="INC-1024",
        status=LifeOSState.NORMAL,
        plan_version=1,
        telemetry=Telemetry(lat=24.8607, lng=67.0011, speed_kmh=45.0, impact_g=0.1, decibel_level=40.0, last_updated=ts),
        triage=TriageAssessment(
            severity="LOW", confidence=0.99, victim_responsive=True, requires_trauma=False, requires_extrication=False, urgency_window="N/A", evidence_chain=["Baseline motion telemetry nominal"]
        ),
        timeline=[AuditLogEntry(timestamp=ts, event="System initialized in NORMAL mode")]
    )

current_state = get_initial_state()
log_transition(current_state)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await websocket.send_json(current_state.model_dump())
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    async def broadcast(self, state: EmergencyState):
        for connection in self.active_connections:
            try:
                await connection.send_json(state.model_dump())
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/state")
def get_state():
    return current_state

@app.post("/simulate/crash")
async def trigger_crash():
    global current_state
    current_state = transition_state(current_state, LifeOSState.CONFIRMATION, "Crash impact detected")
    current_state.telemetry.impact_g = 6.8
    current_state.telemetry.speed_kmh = 0.0
    current_state.telemetry.decibel_level = 94.0
    current_state.telemetry.last_updated = datetime.now(timezone.utc).isoformat()
    current_state = fallback_triage(current_state)
    
    log_transition(current_state)
    await manager.broadcast(current_state)
    return {"status": "crash_simulated"}

@app.post("/simulate/unresponsive")
async def trigger_unresponsive():
    global current_state
    current_state = transition_state(current_state, LifeOSState.ACTIVE, "Victim unresponsive to 10s challenge")
    current_state.triage.victim_responsive = False
    current_state.triage.urgency_window = "GOLDEN_HOUR_URGENT: <15 mins to neuro/trauma intervention"
    current_state.triage.evidence_chain.append("10-second vocal challenge unanswered")
    
    match, rejected = score_and_match(current_state.telemetry.lat, current_state.telemetry.lng, current_state.triage.requires_trauma, hospitals_db)
    if match:
        current_state.allocation = Allocation(
            ambulance_id="AMB-04", target_hospital=match["name"], eta_minutes=match["eta"], hospital_status="AVAILABLE", rationale=match["rationale"], math_breakdown=match["math_breakdown"], rejected_facilities=rejected
        )
        current_state.stakeholder_payloads = generate_payloads(current_state, match["name"], match["eta"])
        ts = datetime.now(timezone.utc).isoformat()
        current_state.timeline.append(AuditLogEntry(timestamp=ts, event=f"Dispatched AMB-04 to {match['name']}"))
    
    log_transition(current_state)
    await manager.broadcast(current_state)
    return {"status": "plan_v1_locked"}

@app.post("/simulate/gridlock")
async def trigger_gridlock():
    global current_state
    if not current_state.allocation:
        return {"error": "No allocation exists"}
    
    prev_hospital = current_state.allocation.target_hospital
    current_state = transition_state(current_state, LifeOSState.RE_PLANNING, f"{prev_hospital} reported gridlock")
    
    exclude = [h["id"] for h in hospitals_db if h["name"] == prev_hospital]
    match, rejected = score_and_match(current_state.telemetry.lat, current_state.telemetry.lng, current_state.triage.requires_trauma, hospitals_db, exclude_ids=exclude)
    
    if match:
        current_state.allocation = Allocation(
            ambulance_id="AMB-04", target_hospital=match["name"], eta_minutes=match["eta"], hospital_status="REROUTED", rationale=match["rationale"], math_breakdown=match["math_breakdown"], rejected_facilities=rejected
        )
        current_state.stakeholder_payloads = generate_payloads(current_state, match["name"], match["eta"])
        current_state.stakeholder_payloads.hospital_emr = f"REROUTED: Target changed from {prev_hospital} due to gridlock. Inbound ETA {match['eta']} min."
        ts = datetime.now(timezone.utc).isoformat()
        current_state.timeline.append(AuditLogEntry(timestamp=ts, event=f"Dynamic re-plan: Rerouted to {match['name']}"))
    
    log_transition(current_state)
    await manager.broadcast(current_state)
    return {"status": "plan_v2_rerouted"}

@app.post("/simulate/reset")
async def trigger_reset():
    global current_state
    current_state = get_initial_state()
    log_transition(current_state)
    await manager.broadcast(current_state)
    return {"status": "reset"}
