'use client';
import { useState } from 'react';

export default function StakeholderPortals({ state }: { state: any }) {
  const [tab, setTab] = useState<'family'|'responder'|'emr'>('responder');
  if (!state) return null;
  const payloads = state.stakeholder_payloads;

  return (
    <div className="glass-panel rounded-lg flex flex-col font-mono h-full max-h-[350px] shadow-lg overflow-hidden">
      <div className="flex border-b border-slate-700/80">
        <button onClick={() => setTab('responder')} className={`flex-1 text-[10px] py-2.5 font-bold transition-all ${tab === 'responder' ? 'bg-[#ff9100]/20 text-[#ff9100] border-b-2 border-[#ff9100]' : 'text-slate-500 hover:bg-slate-800/50'}`}>RESPONDER HUD</button>
        <button onClick={() => setTab('emr')} className={`flex-1 text-[10px] py-2.5 font-bold transition-all ${tab === 'emr' ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-b-2 border-[#00f0ff]' : 'text-slate-500 hover:bg-slate-800/50'}`}>HOSPITAL EMR</button>
        <button onClick={() => setTab('family')} className={`flex-1 text-[10px] py-2.5 font-bold transition-all ${tab === 'family' ? 'bg-[#00e676]/20 text-[#00e676] border-b-2 border-[#00e676]' : 'text-slate-500 hover:bg-slate-800/50'}`}>FAMILY COMMS</button>
      </div>
      
      <div className="p-4 flex-grow overflow-y-auto bg-[#030712]/30 relative">
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
           <div className={`w-1.5 h-1.5 rounded-full ${payloads ? 'bg-[#00e676] animate-pulse' : 'bg-slate-600'}`} />
           <span className="text-[8px] text-slate-500">LINK {payloads ? 'ACTIVE' : 'IDLE'}</span>
        </div>

        {!payloads && <div className="text-slate-600 italic text-[11px] mt-4 text-center">Awaiting data payloads...</div>}
        
        {payloads && tab === 'responder' && (
          <div className="text-[12px] text-[#00e676] leading-relaxed bg-[#00e676]/5 p-3 rounded border border-[#00e676]/30 relative overflow-hidden h-full">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00e676]/10 via-transparent to-transparent pointer-events-none" />
            <div className="text-[9px] text-[#00e676] mb-2 border-b border-[#00e676]/30 pb-1 font-bold tracking-widest flex justify-between">
              <span>NIGHT-VISION HUD_</span>
              <span className="animate-pulse">HAZARD: HIGH</span>
            </div>
            <div className="font-bold mb-2">TARGET: {state.allocation?.target_hospital}</div>
            <div className="opacity-90">{payloads.responder}</div>
          </div>
        )}
        
        {payloads && tab === 'emr' && (
          <div className="text-[12px] text-[#00f0ff] leading-relaxed bg-[#00f0ff]/5 p-3 rounded border border-[#00f0ff]/30 h-full">
            <div className="text-[9px] text-[#00f0ff] mb-2 border-b border-[#00f0ff]/30 pb-1 font-bold flex justify-between">
              <span>TRAUMA INTAKE FEED</span>
              <span>T-MINUS {state.allocation?.eta_minutes}:00</span>
            </div>
            <div className="text-white mb-2 font-bold bg-[#ff1744]/20 border border-[#ff1744]/50 px-2 py-1 rounded inline-block">
              GCS ESTIMATE: 3-8 (SEVERE)
            </div>
            <div className="opacity-90 mt-2">{payloads.hospital_emr}</div>
          </div>
        )}
        
        {payloads && tab === 'family' && (
          <div className="text-[12px] text-slate-800 leading-relaxed bg-[#e5ddd5] p-3 rounded-lg border border-slate-300 h-full font-sans shadow-inner">
             <div className="text-[10px] text-slate-500 mb-2 font-bold text-center border-b border-slate-300 pb-1">Encrypted Message</div>
             <div className="bg-[#dcf8c6] p-3 rounded-lg rounded-tl-none shadow-sm inline-block max-w-[90%]">
               {payloads.family}
               <div className="text-[9px] text-slate-400 text-right mt-1">Just now ✓✓</div>
             </div>
          </div>
        )}
      </div>

      {payloads && (
        <div className="p-2 border-t border-slate-700/80 bg-gradient-to-r from-[#ff1744]/20 to-transparent flex items-center gap-3">
          <div className="w-1 h-full bg-[#ff1744]" />
          <div className="flex-grow">
            <div className="text-[9px] text-[#ff1744] font-bold">VICTIM DASHBOARD UI</div>
            <div className="text-[11px] text-white font-medium animate-pulse">{payloads.victim_ui}</div>
          </div>
        </div>
      )}
    </div>
  );
}