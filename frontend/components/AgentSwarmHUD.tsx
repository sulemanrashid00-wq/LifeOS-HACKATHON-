'use client';

export default function AgentSwarmHUD({ state }: { state: any }) {
  if (!state) return null;
  const s = state.status;
  
  const pActive = s !== 'NORMAL';
  const tActive = s === 'ACTIVE_EMERGENCY' || s === 'RE_PLANNING' || s === 'DISPATCHED' || s === 'CONFIRMATION';
  const rActive = s === 'ACTIVE_EMERGENCY' || s === 'RE_PLANNING' || s === 'DISPATCHED';
  const replanActive = s === 'RE_PLANNING';
  
  return (
    <div className="glass-panel p-3 rounded-lg border border-[#00f0ff]/30 shadow-lg font-mono mb-4">
       <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2 mb-3">
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse glow-cyan" />
           <span className="text-[10px] text-[#00f0ff] tracking-widest font-bold">AI ORCHESTRATION PIPELINE</span>
         </div>
         <span className="text-[9px] text-slate-400">4-AGENT SWARM ACTIVE</span>
       </div>
       
       <div className="flex gap-2 text-[9px] w-full items-center">
         <AgentNode title="1. Perception Agent" isActive={pActive} text={pActive ? "Verifying 6.8G IMU vs 94dB Acoustic Crash" : "Monitoring telemetry streams..."} />
         <Arrow active={pActive} />
         
         <AgentNode title="2. Triage Agent" isActive={tActive} text={tActive ? "Vocal challenge failed. Urgency: GOLDEN_HOUR_HIGH" : "Awaiting anomalies..."} />
         <Arrow active={tActive} />
         
         <AgentNode title="3. Resource Matcher" isActive={rActive} text={rActive ? "Clifton bypassed (No Trauma). Jinnah Selected." : "Awaiting triage hypothesis..."} />
         <Arrow active={replanActive || rActive} />
         
         <AgentNode title="4. Dynamic Re-Plan" isActive={replanActive || rActive} highlight={replanActive} text={replanActive ? "Capacity delta monitored. Sub-5ms reroute active!" : "Standby. Monitoring capacity delta..."} />
       </div>
    </div>
  )
}

function AgentNode({ title, isActive, text, highlight }: any) {
  let border = isActive ? (highlight ? 'border-[#ff9100]' : 'border-[#00e676]') : 'border-slate-700';
  let bg = isActive ? (highlight ? 'bg-[#ff9100]/20' : 'bg-[#00e676]/10') : 'bg-slate-800/40';
  let glow = isActive ? (highlight ? 'glow-amber' : 'shadow-[0_0_10px_rgba(0,230,118,0.2)]') : '';
  let dot = isActive ? (highlight ? 'bg-[#ff9100] animate-pulse' : 'bg-[#00e676]') : 'bg-slate-600';
  let textColor = isActive ? (highlight ? 'text-[#ff9100]' : 'text-[#00e676]') : 'text-slate-500';

  return (
    <div className={`flex-1 p-2 rounded border ${border} ${bg} ${glow} transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[85px] h-[85px]`}>
       <div className="flex items-center gap-1.5 mb-1">
         <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${dot}`} />
         <span className={`font-bold ${textColor} truncate`}>{title}</span>
       </div>
       <div className={`leading-tight text-[8px] overflow-hidden ${isActive ? 'text-slate-200' : 'text-slate-500 italic'}`}>
          {text}
       </div>
    </div>
  )
}

function Arrow({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center -mx-1">
       <div className={`h-[2px] w-3 ${active ? 'bg-[#00f0ff] shadow-[0_0_5px_#00f0ff]' : 'bg-slate-700'} transition-all`} />
       <div className={`w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] ${active ? 'border-l-[#00f0ff]' : 'border-l-slate-700'} transition-all`} />
    </div>
  )
}

