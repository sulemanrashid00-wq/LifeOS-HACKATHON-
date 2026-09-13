import { create } from 'zustand';
import { EmergencyState } from '../types/emergency';

interface StoreState {
  state: EmergencyState;
  ws: WebSocket | null;
  connect: () => void;
  triggerEvent: (endpoint: string) => Promise<void>;
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
      // Exponential backoff logic mock for resilience
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
      console.error("Failed to trigger event", e);
    }
  }
}));