'use client';
import { useEmergencyStore } from '@/store/useEmergencyStore';
import { useAudioFx } from '@/hooks/useAudioFx';

export default function SimulatorDeck() {
  const { triggerEvent, state } = useEmergencyStore();
  const { playBlip, playImpactKlaxon, playRerouteTone } = useAudioFx();

  const handleCrash = () => { playImpactKlaxon(); triggerEvent('/simulate/crash'); };
  const handleUnresponsive = () => { playBlip(); setTimeout(playBlip, 150); triggerEvent('/simulate/unresponsive'); };
  const handleGridlock = () => { playRerouteTone(); triggerEvent('/simulate/gridlock'); };
  const handleReset = () => { playBlip(); triggerEvent('/simulate/reset'); };

  const handleFullDemo = async () => {
    handleCrash();
    await new Promise(r => setTimeout(r, 2000));
    handleUnresponsive();
    await new Promise(r => setTimeout(r, 4000));
    handleGridlock();
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel border border-[#00f0ff]/40 p-3 rounded-xl flex flex-col gap-2 w-max shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[9999] font-mono backdrop-blur-xl">
      <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1 px-1">
         <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-400 font-bold tracking-widest">SIMULATION CONTROL DOCK</span>
            <button onClick={handleFullDemo} className="bg-[#00f0ff]/20 hover:bg-[#00f0ff]/40 border border-[#00f0ff] text-[#00f0ff] text-[8px] font-bold px-2 py-0.5 rounded transition-all">▶ AUTO-RUN DEMO</button>
         </div>
         <div className="flex gap-3 text-[9px]">
            <span className="text-slate-500">LATENCY: <span className="text-[#00e676]">12ms</span></span>
            <span className="text-slate-500">PLAN: <span className="text-[#00f0ff]">v{state?.plan_version || 1}</span></span>
         </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleCrash} className="px-4 py-2.5 bg-gradient-to-b from-[#ff1744]/20 to-[#ff1744]/5 hover:from-[#ff1744]/40 border border-[#ff1744]/80 text-[#ff1744] text-[10px] font-bold rounded shadow-[inset_0_1px_rgba(255,255,255,0.1),0_0_15px_rgba(255,23,68,0.2)] transition-all">
          💥 1. TRIGGER 6.8G COLLISION
        </button>
        <button onClick={handleUnresponsive} className="px-4 py-2.5 bg-gradient-to-b from-[#ff9100]/20 to-[#ff9100]/5 hover:from-[#ff9100]/40 border border-[#ff9100]/80 text-[#ff9100] text-[10px] font-bold rounded shadow-[inset_0_1px_rgba(255,255,255,0.1)] transition-all">
          ⏱️ 2. CONFIRM UNRESPONSIVE
        </button>
        <button onClick={handleGridlock} className="px-4 py-2.5 bg-gradient-to-b from-[#ff1744]/20 to-[#ff1744]/5 hover:from-[#ff1744]/40 border border-[#ff1744]/80 text-white text-[10px] font-bold rounded shadow-[inset_0_1px_rgba(255,255,255,0.1),0_0_10px_rgba(255,23,68,0.4)] transition-all">
          🚨 3. SIMULATE HOSPITAL GRIDLOCK
        </button>
        <button onClick={handleReset} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-[10px] font-bold rounded shadow-[inset_0_1px_rgba(255,255,255,0.1)] transition-all ml-4">
          🔄 SYSTEM RESET
        </button>
      </div>
    </div>
  );
}