'use client';
import dynamic from 'next/dynamic';

const LeafletCore = dynamic(() => import('./LeafletCore'), { ssr: false });

export default function TacticalMap({ state }: { state: any }) {
  return (
    <div className="relative w-full h-[460px] min-h-[400px] flex-grow" style={{ height: '100%', width: '100%' }}>
      <div className="absolute inset-0 z-0 h-full w-full">
        <LeafletCore state={state} />
        
        {/* Corner crosshairs UI decoration */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00f0ff]/50 z-10 pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00f0ff]/50 z-10 pointer-events-none"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#00f0ff]/50 z-10 pointer-events-none"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#00f0ff]/50 z-10 pointer-events-none"></div>
      </div>
    </div>
  );
}