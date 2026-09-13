'use client';
import { useEffect, useState } from 'react';
import { useEmergencyStore } from '@/store/useEmergencyStore';
import TacticalMap from '@/components/TacticalMap';
import SensorHUD from '@/components/SensorHUD';
import HospitalMatrix from '@/components/HospitalMatrix';
import StakeholderPortals from '@/components/StakeholderPortals';
import AuditTimeline from '@/components/AuditTimeline';
import SimulatorDeck from '@/components/SimulatorDeck';
import AgentSwarmHUD from '@/components/AgentSwarmHUD';

export default function CommandCenter() {
  const { state, connect } = useEmergencyStore();
  const [time, setTime] = useState('');

  useEffect(() => {
    connect();
    const t = setInterval(() => {
       const now = new Date();
       setTime(`${now.getUTCHours().toString().padStart(2,'0')}:${now.getUTCMinutes().toString().padStart(2,'0')}:${now.getUTCSeconds().toString().padStart(2,'0')} UTC`);
    }, 1000);
    return () => clearInterval(t);
  }, [connect]);



  return (
    <main className="min-h-screen bg-[#030712] tactical-grid p-4 font-mono text-slate-300 scanlines flex flex-col h-screen overflow-hidden selection:bg-[#00f0ff] selection:text-[#030712]">
      
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-end border-b border-[#00f0ff]/30 pb-3 mb-4 z-10 bg-[#030712]/90 backdrop-blur-md px-2">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-6 h-6">
            <div className={`absolute w-3 h-3 rounded-full ${state.status !== 'NORMAL' ? 'bg-[#ff1744] glow-crimson' : 'bg-[#00e676]'}`} />
            {state.status !== 'NORMAL' && <div className="absolute w-6 h-6 border border-[#ff1744] rounded-full animate-ping opacity-60" />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#f8fafc] tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] flex items-center gap-2">
              LIFEOS <span className="text-[10px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-1.5 py-0.5 rounded tracking-normal">AI KERNEL ACTIVE</span>
            </h1>
            <div className="text-[9px] text-[#00f0ff]/70 font-bold tracking-[0.2em] mt-0.5">AUTONOMOUS EMERGENCY OPERATING SYSTEM</div>
          </div>
        </div>
        
        <div className="flex gap-8 items-end">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 font-bold tracking-wider">MISSION CLOCK</span>
            <span className="text-[#00f0ff] font-bold tracking-widest text-glow-cyan">{time || '00:00:00 UTC'}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 font-bold tracking-wider">INCIDENT ID</span>
            <span className="text-[#ff9100] font-black">{state.incident_id}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 font-bold tracking-wider">SYSTEM STATE</span>
            <span className={`font-black tracking-widest ${state.status !== 'NORMAL' ? 'text-[#ff1744] text-glow-crimson' : 'text-[#00e676]'}`}>{state.status}</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5 flex-grow overflow-hidden z-10 px-2 pb-2">
        {/* Left Column (Sensors & Hospitals) */}
        <div className="col-span-3 flex flex-col gap-4 h-full">
          <SensorHUD state={state} />
          <HospitalMatrix state={state} />
        </div>

        {/* Center Column (Swarm HUD, Tactical Map & Controls) */}
        <div className="col-span-6 flex flex-col relative h-full">
          <AgentSwarmHUD state={state} />
          
          <div className="flex-grow glass-panel rounded-lg relative overflow-hidden shadow-xl border-[#00f0ff]/30">
             <TacticalMap state={state} />
             {/* Reticle Decor */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#00f0ff]/10 rounded-full pointer-events-none" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#00f0ff]/5 rounded-full pointer-events-none" />
          </div>
          <SimulatorDeck />
        </div>

        {/* Right Column (Comms & Audit) */}
        <div className="col-span-3 flex flex-col gap-4 h-full">
          <StakeholderPortals state={state} />
          <AuditTimeline state={state} />
        </div>
      </div>
    </main>
  );
}