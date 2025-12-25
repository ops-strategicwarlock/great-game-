
import React from 'react';
import { Territory, Faction } from '../types';
import { FACTION_COLORS } from '../constants';

interface MapInterfaceProps {
  territories: Territory[];
  onSelect: (t: Territory) => void;
  onScan: () => void;
  isScanning: boolean;
}

const MapInterface: React.FC<MapInterfaceProps> = ({ territories, onSelect, onScan, isScanning }) => {
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-[#32cd32] pb-2">
        <h2 className="text-xl uppercase tracking-tighter">Bakersfield // Tactical Strands</h2>
        <button 
          onClick={onScan}
          disabled={isScanning}
          className={`px-4 py-1 border border-[#32cd32] text-xs font-bold uppercase transition-all ${isScanning ? 'bg-[#32cd3233] animate-pulse' : 'hover:bg-[#32cd32] hover:text-black shadow-[0_0_10px_rgba(50,205,50,0.3)]'}`}
        >
          {isScanning ? '[SCANNING...]' : '[LORE SCANNER]'}
        </button>
      </div>
      
      <div className="flex-1 relative border border-[#32cd3233] bg-[#050705] rounded flex items-center justify-center overflow-hidden">
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden bg-[#32cd3205]">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#32cd3233] animate-[scan_2s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border border-[#32cd3255] rounded-full animate-ping opacity-20"></div>
              <div className="w-48 h-48 border border-[#32cd3233] rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes scan {
            from { top: 0; }
            to { top: 100%; }
          }
        `}</style>

        <svg viewBox="0 0 800 600" className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#32cd3211" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#grid)" />
          
          {territories.map((t, idx) => {
            const x = 100 + (idx % 3) * 250;
            const y = 100 + Math.floor(idx / 3) * 200;
            
            return (
              <g key={t.id} onClick={() => onSelect(t)} className="cursor-pointer group">
                <circle cx={x} cy={y} r="60" fill={FACTION_COLORS[t.owner]} fillOpacity="0.05" className="transition-all group-hover:fill-opacity-20" />
                <circle cx={x} cy={y} r="8" fill={FACTION_COLORS[t.owner]} />
                <circle cx={x} cy={y} r="12" fill="none" stroke={FACTION_COLORS[t.owner]} strokeWidth="2" className="animate-pulse" />
                
                {/* Stability Gauge */}
                <rect x={x - 30} y={y - 25} width="60" height="4" fill="#000" rx="2" />
                <rect x={x - 30} y={y - 25} width={(t.stability / 100) * 60} height="4" fill={t.stability < 40 ? '#ff0000' : '#32cd32'} rx="2" />

                <text x={x} y={y + 35} textAnchor="middle" fill="#32cd32" fontSize="11" className="font-bold">
                  {t.name}
                </text>
                <text x={x} y={y + 48} textAnchor="middle" fill="#ffffff" fontSize="9" opacity="0.6" className="uppercase">
                  {t.owner} // {t.stability}% STB
                </text>
              </g>
            );
          })}
        </svg>
        
        <div className="absolute bottom-4 right-4 bg-[#0a0c0a] border border-[#32cd32] p-2 text-[10px] space-y-1">
          <div className="font-bold border-b border-[#32cd32] mb-1 uppercase">Control Key</div>
          {Object.entries(FACTION_COLORS).map(([faction, color]) => (
            <div key={faction} className="flex items-center gap-2">
              <div className="w-2 h-2" style={{ backgroundColor: color }}></div>
              <span>{faction}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapInterface;
