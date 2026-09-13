'use client';
import { useEmergencyStore } from '@/store/useEmergencyStore';

export default function HospitalMatrix({ state }: { state: any }) {
  const { triggerEvent } = useEmergencyStore();

  if (!state) return null;
  const isEmergency = state.status !== 'NORMAL' && state.status !== 'SUSPICIOUS';
  const alloc = state.allocation;

  return (
    <div className="glass-panel rounded-lg p-4 flex-grow flex flex-col font-mono shadow-lg h-full">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-3">
        <h2 className="text-[#00f0ff] text-[11px] font-bold uppercase tracking-widest text-glow-cyan">CAPABILITY MATRIX</h2>
        <span className="text-[9px] text-[#ff9100] border border-[#ff9100]/50 px-2 py-0.5 rounded bg-[#ff9100]/10">LIVE ROUTING</span>
      </div>
      
      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {alloc ? (
          <div className={`p-3 rounded border relative overflow-hidden transition-all duration-500 ${alloc.hospital_status === 'AVAILABLE' ? 'bg-[#00f0ff]/10 border-[#00f0ff] glow-cyan' : 'bg-[#ff9100]/20 border-[#ff9100] glow-amber'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-50" />
            <div className="flex justify-between items-start mb-2 pl-2">
               <div className={`text-xs font-black ${alloc.hospital_status === 'AVAILABLE' ? 'text-[#00f0ff]' : 'text-[#ff9100]'}`}>TARGET: {alloc.target_hospital}</div>
               <div className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-full border border-slate-600 font-bold">{alloc.eta_minutes} MIN ETA</div>
            </div>
            <div className="pl-2">
               <div className="text-[10px] text-slate-300 flex justify-between">
                  <span>STATUS:</span>
                  <span className={alloc.hospital_status === 'AVAILABLE' ? 'text-[#00e676] font-bold' : 'text-[#ff1744] font-bold animate-pulse'}>{alloc.hospital_status}</span>
               </div>
               <div className="text-[9px] text-slate-400 mt-2 bg-[#030712]/60 p-1.5 rounded border border-slate-800 leading-tight">
                 <div className="text-[#00f0ff] mb-1 font-bold">MATH BREAKDOWN:</div>
                 <div className="font-mono">{alloc.math_breakdown || alloc.rationale}</div>
               </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border border-slate-800 bg-[#030712]/50 rounded text-center text-[10px] text-slate-500 italic">
            Awaiting routing lock...
          </div>
        )}
        
        {/* Rejected Hospitals Mapping */}
        {isEmergency && alloc?.rejected_facilities?.map((rejected: any, idx: number) => (
           <div key={idx} className="p-2 rounded border border-slate-800 bg-[#030712]/80 opacity-80 flex flex-col gap-1 hover:border-slate-600 transition-colors">
              <div className="text-[11px] font-bold text-slate-400 flex justify-between">
                 <span>{rejected.name}</span>
                 {rejected.name.includes("Hospital B") && alloc.target_hospital.includes("Hospital B") && (
                   <button onClick={() => triggerEvent('/simulate/gridlock')} className="text-[8px] bg-[#ff1744]/20 text-[#ff1744] border border-[#ff1744] px-1 rounded hover:bg-[#ff1744]/40 transition-all pointer-events-auto">Simulate Gridlock</button>
                 )}
              </div>
              <div className="flex justify-between items-center mt-1">
                 <span className="text-[9px] text-[#ff1744] font-bold border border-[#ff1744]/30 bg-[#ff1744]/10 px-1 py-0.5 rounded">{rejected.reason}</span>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}