from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Telemetry(BaseModel):
    lat: float
    lng: float
    speed_kmh: float
    impact_g: float
    impact_g_x: float = 0.0
    impact_g_y: float = 0.0
    impact_g_z: float = 0.0
    decibel_level: float
    last_updated: str

class TriageAssessment(BaseModel):
    severity: str
    confidence: float
    victim_responsive: bool
    requires_trauma: bool
    requires_extrication: bool
    urgency_window: str = "TBD"
    evidence_chain: List[str]

class Allocation(BaseModel):
    ambulance_id: str
    target_hospital: str
    eta_minutes: int
    hospital_status: str
    rationale: str
    math_breakdown: str = ""
    rejected_facilities: List[Dict[str, str]] = Field(default_factory=list)

class StakeholderPayloads(BaseModel):
    victim_ui: str
    family: str
    responder: str
    hospital_emr: str

class AuditLogEntry(BaseModel):
    timestamp: str
    event: str

class EmergencyState(BaseModel):
    incident_id: str
    status: str
    plan_version: int
    telemetry: Telemetry
    triage: TriageAssessment
    allocation: Optional[Allocation] = None
    stakeholder_payloads: Optional[StakeholderPayloads] = None
    timeline: List[AuditLogEntry] = Field(default_factory=list)