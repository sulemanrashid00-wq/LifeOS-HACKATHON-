'use client';
import { useEffect, useState } from 'react';

export default function SensorHUD({ state }: { state: any }) {
  const [noise, setNoise] = useState({ g: 0, db: 0, lat: 0, lng: 0 });
  
  useEffect(() => {
    if (state?.status === 'NORMAL') {
      const interval = setInterval(() => {
        setNoise({
           g: (Math.random() - 0.5) * 0.05,
           db: (Math.random() - 0.5) * 2.0,
           lat: (Math.random() - 0.5) * 0.00001,
           lng: (Math.random() - 0.5) * 0.00001
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setNoise({ g: 0, db: 0, lat: 0, lng: 0 });
    }
  }, [state?.status]);

  if (!state) return null;
  const gForce = Math.max(0, state.telemetry.impact_g + noise.g);
  const isImpact = state.status !== 'NORMAL' && state.status !== 'SUSPICIOUS';
  const decibels = Math.max(30, state.telemetry.decibel_level + noise.db);
  const isLoud = decibels > 85;

  const maxG = 10;
  const gAngle = Math.min(180, (gForce / maxG) * 180);

  return (
    <div className="glass-panel rounded-lg p-4 flex flex-col gap-4 shadow-lg text-sm transition-all duration-300 relative overflow-hidden">
      {isImpact && <div className="absolute inset-0 border-2 border-[#ff1744]/40 animate-pulse pointer-events-none rounded-lg" />}
      
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 z-10 relative">
        <h2 className="text-[#00f0ff] font-bold tracking-widest text-[11px] text-glow-cyan">SENSOR HUD</h2>
        <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${isImpact ? 'bg-[#ff1744]/20 text-[#ff1744] border-[#ff1744]/50 animate-pulse' : 'bg-slate-800/80 text-slate-300 border-slate-600'}`}>{isImpact ? 'IMPACT DETECTED' : 'LIVE TELEMETRY'}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 z-10 relative">
        <div className="flex flex-col items-center justify-center bg-[#030712]/60 rounded border border-slate-700/80 p-3 relative h-28 shadow-inner">
          <div className="text-[9px] text-slate-500 absolute top-2 left-2 font-bold tracking-wider">G-FORCE VECTOR</div>
          <svg viewBox="0 0 100 50" className="w-full mt-4 max-w-[100px] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
             <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
             <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={isImpact ? "#ff1744" : "#00f0ff"} strokeWidth="6" strokeLinecap="round" strokeDasharray="125.6" strokeDashoffset={125.6 - (gAngle / 180 * 125.6)} className="transition-all duration-300 ease-out" />
             <circle cx="50" cy="50" r="4" fill={isImpact ? "#ff1744" : "#00f0ff"} />
          </svg>
          <div className={`text-2xl font-black mt-[-10px] ${isImpact ? 'text-[#ff1744] text-glow-crimson' : 'text-[#00f0ff] text-glow-cyan'}`}>{gForce.toFixed(2)}<span className="text-xs ml-1">G</span></div>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#030712]/60 rounded border border-slate-700/80 p-3 relative h-28 shadow-inner">
          <div className="text-[9px] text-slate-500 absolute top-2 left-2 font-bold tracking-wider">AUDIO SPL</div>
          <div className="flex items-end gap-[3px] h-10 w-full justify-center opacity-90 mt-3">
             {[...Array(12)].map((_, i) => {
               const height = isLoud ? 40 + Math.random() * 60 : 10 + Math.random() * 30;
               return <div key={i} className={`w-1.5 rounded-t-sm transition-all duration-75 ${isLoud ? 'bg-[#ff1744] shadow-[0_0_5px_#ff1744]' : 'bg-[#00e676]'}`} style={{ height: `${height}%` }} />
             })}
          </div>
          <div className={`text-xl font-black mt-2 ${isLoud ? 'text-[#ff1744] text-glow-crimson' : 'text-[#00e676]'}`}>{decibels.toFixed(1)}<span className="text-xs ml-1">dB</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-1 z-10 relative">
        <div className="bg-[#030712]/80 rounded border border-[#ff9100]/30 p-2 shadow-inner">
          <div className="text-[9px] text-[#ff9100] mb-2 font-bold tracking-widest border-b border-[#ff9100]/30 pb-1 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-[#ff9100] rounded-full animate-pulse"></div>[LIVE SENSOR RAW]</div>
          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between"><span>LAT:</span> <span className="text-[#00f0ff]">{(state.telemetry.lat + noise.lat).toFixed(5)}</span></div>
            <div className="flex justify-between"><span>LNG:</span> <span className="text-[#00f0ff]">{(state.telemetry.lng + noise.lng).toFixed(5)}</span></div>
            <div className="flex justify-between"><span>SPD:</span> <span className={state.telemetry.speed_kmh === 0 ? 'text-[#ff9100] font-bold' : 'text-slate-300'}>{state.telemetry.speed_kmh.toFixed(1)} KM/H</span></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#00f0ff]/10 to-transparent rounded border border-[#00f0ff]/40 p-2 shadow-inner relative overflow-hidden">
          <div className="text-[9px] text-[#00f0ff] mb-2 font-bold tracking-widest border-b border-[#00f0ff]/40 pb-1 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full"></div>[TRIAGE INFERENCE]</div>
          <div className="text-[11px] text-slate-300 space-y-1 relative z-10">
            <div className="flex justify-between"><span>SEV:</span> <span className={state.triage.severity === 'HIGH' ? 'text-[#ff1744] font-bold' : 'text-[#00e676]'}>{state.triage.severity}</span></div>
            <div className="flex justify-between"><span>RSP:</span> <span className={!state.triage.victim_responsive ? 'text-[#ff1744] font-bold' : 'text-[#00e676]'}>{state.triage.victim_responsive ? 'YES' : 'NO'}</span></div>
            <div className="flex justify-between"><span>EXT:</span> <span className={state.triage.requires_extrication ? 'text-[#ff9100] font-bold' : 'text-slate-500'}>{state.triage.requires_extrication ? 'REQ' : 'NO'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}