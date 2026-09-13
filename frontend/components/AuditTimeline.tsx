export default function AuditTimeline({ state }: { state: any }) {
  if (!state) return null;
  return (
    <div className="glass-panel rounded-lg p-3 flex-grow flex flex-col font-mono min-h-[220px] shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2">
        <h2 className="text-[#00f0ff] text-[11px] font-bold uppercase tracking-widest text-glow-cyan">AUDIT LEDGER</h2>
        <span className="text-[9px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-600">IMMUTABLE LOG</span>
      </div>
      
      <div className="flex-grow overflow-y-auto space-y-3 flex flex-col-reverse pr-1">
        {[...(state.timeline || [])].reverse().map((log: any, i: number) => {
          // Parse time for a cleaner display
          const time = new Date(log.timestamp).toISOString().split('T')[1].replace('Z', '');
          
          return (
            <div key={i} className="text-[10px] break-words relative pl-3">
               <div className="absolute left-0 top-1 w-1 h-1 bg-[#00f0ff] rounded-full glow-cyan" />
               <div className="absolute left-[1.5px] top-2 bottom-[-10px] w-px bg-[#00f0ff]/20" />
               <span className="text-[#ffb700] mr-2">{time}</span>
               <span className="text-slate-300">{log.event}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}