export interface AuditLogEntry {
  timestamp: string;
  event: string;
}

export interface Telemetry {
  lat: number;
  lng: number;
  speed_kmh: number;
  impact_g: number;
  decibel_level: number;
  last_updated: string;
}

export interface RejectedFacility {
  name: string;
  reason: string;
}

export interface Allocation {
  ambulance_id: string;
  target_hospital: string;
  eta_minutes: number;
  hospital_status: string;
  rationale: string;
  math_breakdown: string;
  rejected_facilities: RejectedFacility[];
}

export interface EmergencyState {
  incident_id: string;
  status: string;
  plan_version: number;
  telemetry: Telemetry;
  triage: any;
  allocation: Allocation | null;
  stakeholder_payloads: any;
  timeline: AuditLogEntry[];
}

