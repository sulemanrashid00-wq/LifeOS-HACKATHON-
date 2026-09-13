'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PitchDeck() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setSlide((s) => Math.min(4, s + 1));
      } else if (e.key === 'ArrowLeft') {
        setSlide((s) => Math.max(0, s - 1));
      } else if (e.key === 'd' || e.key === 'D') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const slides = [
    {
      title: "THE FATAL 45-MINUTE BLIND SPOT",
      subtitle: "Why Current SOS Protocols Fail",
      content: (
        <div className="space-y-6">
          <p className="text-xl text-slate-300">Modern smartwatches detect crashes perfectly and send an SMS—but then they stop.</p>
          <div className="p-6 bg-[#ff1744]/10 border border-[#ff1744]/40 rounded-lg text-lg">
            <h3 className="text-[#ff1744] font-bold mb-2">The Reality:</h3>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>The victim is unconscious in transit.</li>
              <li>First responders lack clinical intake data.</li>
              <li>Ambulances blindly route to the closest clinic, not the trauma-capable center.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "THE MULTIMODAL INTELLIGENCE LAYER",
      subtitle: "Sensor Fusion & Strict Inference Isolation",
      content: (
        <div className="grid grid-cols-2 gap-8">
          <div className="p-6 border border-[#ff9100]/40 bg-[#ff9100]/10 rounded-lg">
             <h3 className="text-[#ff9100] font-bold mb-4 text-xl">OBSERVED SENSORS</h3>
             <ul className="space-y-2 text-lg text-slate-300">
               <li><span className="font-bold text-white">Kinematics:</span> IMU shockwave (6.8G lateral)</li>
               <li><span className="font-bold text-white">Acoustics:</span> 94dB crash signature</li>
               <li><span className="font-bold text-white">Motion:</span> Immediate 0 km/h lock</li>
             </ul>
          </div>
          <div className="p-6 border border-[#00f0ff]/40 bg-[#00f0ff]/10 rounded-lg">
             <h3 className="text-[#00f0ff] font-bold mb-4 text-xl">INFERRED TRIAGE</h3>
             <ul className="space-y-2 text-lg text-slate-300">
               <li><span className="font-bold text-white">Golden Hour:</span> Urgent neuro/trauma</li>
               <li><span className="font-bold text-white">Extrication:</span> Required</li>
               <li><span className="font-bold text-white">Hallucinations:</span> 0% (Deterministic boundary)</li>
             </ul>
          </div>
        </div>
      )
    },
    {
      title: "CAPABILITY-FIRST CLINICAL ROUTING",
      subtitle: "Routing by Surgical Survival, Not Proximity",
      content: (
        <div className="space-y-6">
          <div className="bg-[#030712]/80 border border-slate-700 p-6 rounded-lg text-lg font-mono">
            <div className="text-slate-400 mb-2">System Calculation: FinalScore = (Cap * 0.45) + (ETA * 0.35) + (ICU * 0.20)</div>
            <div className="flex justify-between items-center py-3 border-b border-slate-700">
               <span>Clifton Clinic (3.1km)</span>
               <span className="text-[#ff1744] bg-[#ff1744]/20 px-3 py-1 rounded">REJECTED: NO TRAUMA WARD</span>
            </div>
            <div className="flex justify-between items-center py-3">
               <span className="text-[#00e676] font-bold">Jinnah Trauma Center (6.4km)</span>
               <span className="text-[#00e676] bg-[#00e676]/20 px-3 py-1 rounded">ASSIGNED: SCORE 0.82</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "AUTONOMOUS DYNAMIC RE-PLANNING",
      subtitle: "Sub-5ms Failover Routing",
      content: (
        <div className="space-y-6">
          <div className="relative h-48 border border-slate-700 rounded-lg overflow-hidden bg-gradient-to-r from-[#030712] to-slate-900 flex items-center justify-center p-8">
            <div className="text-center w-1/3">
              <div className="text-3xl font-bold text-[#ff1744] mb-2 animate-pulse">GRIDLOCK</div>
              <div className="text-slate-400">Hospital B Capacity Drops to 0</div>
            </div>
            <div className="w-1/3 flex items-center justify-center">
              <div className="h-1 w-full bg-gradient-to-r from-[#ff1744] to-[#00f0ff] mx-4 relative">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 bg-slate-800 px-2 py-1 rounded">0.004ms FAILOVER</div>
              </div>
            </div>
            <div className="text-center w-1/3">
              <div className="text-3xl font-bold text-[#00f0ff] mb-2">REROUTE</div>
              <div className="text-slate-400">Hospital C Targeted Mid-Transit</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "LIFEOS: UNIFIED SURVIVAL ARCHITECTURE",
      subtitle: "Ready for Field Deployment",
      content: (
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="p-6 border border-[#ff9100]/30 rounded-lg bg-[#ff9100]/5">
            <div className="text-4xl mb-4">🚑</div>
            <h4 className="text-xl font-bold text-[#ff9100] mb-2">Responders</h4>
            <p className="text-slate-400">Night-Vision HUD & Crash Kinematics</p>
          </div>
          <div className="p-6 border border-[#00f0ff]/30 rounded-lg bg-[#00f0ff]/5">
            <div className="text-4xl mb-4">🏥</div>
            <h4 className="text-xl font-bold text-[#00f0ff] mb-2">Hospital EMR</h4>
            <p className="text-slate-400">Pre-Arrival Triage Bay Checklists</p>
          </div>
          <div className="p-6 border border-[#00e676]/30 rounded-lg bg-[#00e676]/5">
            <div className="text-4xl mb-4">👨‍👩‍👧</div>
            <h4 className="text-xl font-bold text-[#00e676] mb-2">Family</h4>
            <p className="text-slate-400">Encrypted SMS Location Tracking</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans tactical-grid scanlines overflow-hidden relative selection:bg-[#00f0ff] selection:text-black">
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
        <div className="text-2xl font-black tracking-widest text-[#00f0ff] font-mono glow-cyan">LIFEOS <span className="text-sm text-slate-500 font-normal ml-2">PITCH_DECK</span></div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="px-6 py-2 bg-slate-800 hover:bg-[#00f0ff] hover:text-black transition-colors font-mono font-bold text-sm rounded border border-slate-600">
             [D] LAUNCH MISSION CONTROL
          </button>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="absolute inset-0 flex items-center justify-center p-20 z-10">
        <div key={slide} className="w-full max-w-5xl animate-[fadeIn_0.3s_ease-out_forwards]">
          <h2 className="text-sm font-bold tracking-[0.2em] text-[#00f0ff] mb-2 font-mono uppercase">{slides[slide].subtitle}</h2>
          <h1 className="text-5xl font-black mb-12 uppercase tracking-tight text-white">{slides[slide].title}</h1>
          {slides[slide].content}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-center z-20 font-mono text-sm">
        <div className="text-slate-500">
           {slide > 0 && <span>← PREV</span>}
        </div>
        <div className="flex gap-2">
          {slides.map((_, i) => (
             <div key={i} className={`w-12 h-1 rounded ${i === slide ? 'bg-[#00f0ff] glow-cyan' : 'bg-slate-700'}`} />
          ))}
        </div>
        <div className="text-slate-500">
           {slide < 4 ? <span>SPACE / NEXT →</span> : <button onClick={() => router.push('/')} className="text-[#00f0ff] animate-pulse">DEPLOY OS →</button>}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}