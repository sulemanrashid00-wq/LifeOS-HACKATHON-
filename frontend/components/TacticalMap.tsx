'use client';
import dynamic from 'next/dynamic';

const LeafletCore = dynamic(() => import('./LeafletCore'), { ssr: false });

export default function TacticalMap({ state }: { state: any }) {
  return (
    <div className="absolute inset-0 z-0">
      <LeafletCore state={state} />
      
      {/* Corner crosshairs UI decoration */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00f0ff]/50 z-10"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00f0ff]/50 z-10"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#00f0ff]/50 z-10"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#00f0ff]/50 z-10"></div>
    </div>
  );
}