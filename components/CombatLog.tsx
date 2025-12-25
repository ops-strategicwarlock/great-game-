
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface CombatLogProps {
  logs: LogEntry[];
}

const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div ref={scrollRef} className="flex-1 border border-[#32cd3233] bg-black p-2 font-mono text-[10px] overflow-y-auto space-y-1">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2">
          <span className="opacity-40 text-[8px] font-bold">[{log.timestamp}]</span>
          <span className="leading-tight">{log.text}</span>
        </div>
      ))}
      {logs.length === 0 && <div className="opacity-30 italic">Awaiting tactical data...</div>}
    </div>
  );
};

export default CombatLog;
