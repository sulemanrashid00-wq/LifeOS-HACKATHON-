import { create } from 'zustand';
import { EmergencyState } from '../types/emergency';

interface StoreState {
  state: EmergencyState;
  ws: WebSocket | null;
  connect: () => void;
  triggerEvent: (endpoint: string) => Promise<void>;
  triggerSimulationStep: (step: number) => void;
  autoRunDemo: () => void;
}

const DEFAULT_STATE: EmergencyState = {
  incident_id: "INC-1024",
  status: "NORMAL",
  plan_version: 1,
  telemetry: { lat: 24.8607, lng: 67.0011, speed_kmh: 45.0, impact_g: 0.1, decibel_level: 40.0, last_updated: new Date().toISOString() },
  triage: { severity: "LOW", confidence: 0.99, victim_responsive: true, requires_trauma: false, requires_extrication: false, urgency_window: "N/A", evidence_chain: ["Nominal baseline telemetry"] },
  timeline: [],
  allocation: null,
  stakeholder_payloads: null
};

export const useEmergencyStore = create<StoreState>((set, get) => ({
  state: DEFAULT_STATE,
  ws: null,
  connect: () => {
    if (get().ws) return;
    const ws = new WebSocket('ws://127.0.0.1:8000/ws');
    
    ws.onmessage = (event) => set({ state: JSON.parse(event.data) });
    
    ws.onclose = () => {
      set({ ws: null });
      setTimeout(() => get().connect(), 3000);
    };
    
    ws.onerror = (err) => {
      console.warn("WebSocket Error:", err);
    };
    
    set({ ws });
  },
  triggerEvent: async (endpoint: string) => {
    try {
      await fetch(`http://127.0.0.1:8000${endpoint}`, { method: 'POST' });
    } catch (e) {
      console.error("Backend unreachable, falling back to local simulation step");
      if (endpoint.includes('crash')) get().triggerSimulationStep(1);
      else if (endpoint.includes('unresponsive')) get().triggerSimulationStep(2);
      else if (endpoint.includes('gridlock')) get().triggerSimulationStep(3);
      else if (endpoint.includes('reset')) get().triggerSimulationStep(0);
    }
  },
  triggerSimulationStep: (step: number) => {
    const currentState = get().state;
    if (step === 0) set({ state: DEFAULT_STATE });
    else if (step === 1) {
      set({ state: { ...currentState, status: 'ACTIVE_EMERGENCY', telemetry: { ...currentState.telemetry, impact_g: 6.8, decibel_level: 94.0 }, timeline: [{ timestamp: new Date().toISOString(), event: "7.2G Impact detected" }] } });
    } else if (step === 2) {
      set({ state: { ...currentState, status: 'DISPATCHED', plan_version: 2, triage: { ...currentState.triage, victim_responsive: false, severity: "GOLDEN_HOUR_HIGH" }, allocation: { ambulance_id: "AMB-7X", target_hospital: "Jinnah Trauma Center (Hospital B)", eta_minutes: 4, hospital_status: "NOMINAL", rationale: "Level-1 Trauma", math_breakdown: "Score: 0.94", rejected_facilities: [] } } });
    } else if (step === 3) {
      set({ state: { ...currentState, status: 'RE_PLANNING', plan_version: 3, allocation: { ...currentState.allocation!, hospital_status: "GRIDLOCK" } } });
      setTimeout(() => {
         set({ state: { ...get().state, status: 'DISPATCHED', plan_version: 4, allocation: { ambulance_id: "AMB-7X", target_hospital: "Aga Khan University Hospital (Hospital C)", eta_minutes: 7, hospital_status: "NOMINAL", rationale: "Gridlock Reroute", math_breakdown: "Score: 0.88", rejected_facilities: [] } } });
      }, 800);
    }
  },
  autoRunDemo: async () => {
    get().triggerSimulationStep(1);
    await new Promise(r => setTimeout(r, 2000));
    get().triggerSimulationStep(2);
    await new Promise(r => setTimeout(r, 4000));
    get().triggerSimulationStep(3);
  }
}));