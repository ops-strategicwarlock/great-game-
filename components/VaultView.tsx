
import React, { useState } from 'react';
import { Agent, Room, VaultResources, ActiveMission, Mission, GameState, Challenge, HydroSlot, AssaultState } from '../types';
import { PRODUCTION_RATES } from '../constants';

interface VaultViewProps {
  vault: GameState['vault'];
  onStep: (ticks: number) => void;
  onAssign: (agentId: string, roomId: string) => void;
  onStartMission: (mission: Mission, team: string[]) => void;
  onPlant: (slotId: string, cropType: HydroSlot['cropType']) => void;
  onHarvest: (slotId: string) => void;
  onEngageWave: () => void;
  onCancelAssault: () => void;
}

const VaultView: React.FC<VaultViewProps> = ({ 
  vault, onStep, onAssign, onStartMission, onPlant, onHarvest, onEngageWave, onCancelAssault 
}) => {
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'ROSTER' | 'COMBAT' | 'MISSIONS'>('OVERVIEW');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isResolvingWave, setIsResolvingWave] = useState(false);

  const toggleAgentForMission = (id: string) => {
    setSelectedAgents(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleWaveAction = async () => {
    setIsResolvingWave(true);
    await onEngageWave();
    setIsResolvingWave(false);
  };

  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden font-mono text-[#32cd32]">
      {/* Top Resources Bar */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-1">
        {(Object.entries(vault.resources) as [string, number][]).map(([res, val]) => (
          <div key={res} className="border border-[#32cd3255] p-1 bg-black/60 text-center shadow-[inset_0_0_5px_rgba(50,205,50,0.1)] relative group">
            <div className="text-[7px] opacity-60 uppercase tracking-tighter">{res}</div>
            <div className={`text-[10px] font-bold ${val < 10 ? 'text-red-500 animate-pulse' : 'text-[#32cd32]'}`}>
              {val.toFixed(1)}
            </div>
            {/* Simple production indicator visual (placeholder) */}
            <div className="absolute top-0 right-1 text-[6px] opacity-40">+{roomProductionOf(vault, res).toFixed(2)}</div>
          </div>
        ))}
        <div className="flex items-center justify-center border border-[#32cd32] bg-[#32cd3211]">
           <button onClick={() => onStep(1)} className="w-full h-full text-[10px] font-bold uppercase hover:bg-[#32cd32] hover:text-black">Tick</button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex gap-2 mb-1 border-b border-[#32cd3233]">
        <button onClick={() => setViewMode('OVERVIEW')} className={`px-3 py-1 text-[10px] uppercase ${viewMode === 'OVERVIEW' ? 'bg-[#32cd32] text-black font-bold' : 'text-[#32cd32] hover:bg-[#32cd3211]'}`}>[1] Sectors</button>
        <button onClick={() => setViewMode('ROSTER')} className={`px-3 py-1 text-[10px] uppercase ${viewMode === 'ROSTER' ? 'bg-[#32cd32] text-black font-bold' : 'text-[#32cd32] hover:bg-[#32cd3211]'}`}>[2] Personnel</button>
        <button onClick={() => setViewMode('COMBAT')} className={`px-3 py-1 text-[10px] uppercase ${viewMode === 'COMBAT' ? 'bg-[#32cd32] text-black font-bold' : 'text-[#32cd32] hover:bg-[#32cd3211]'} relative`}>
          [3] Field Ops
          {vault.activeAssault && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
        </button>
        <button onClick={() => setViewMode('MISSIONS')} className={`px-3 py-1 text-[10px] uppercase ${viewMode === 'MISSIONS' ? 'bg-[#32cd32] text-black font-bold' : 'text-[#32cd32] hover:bg-[#32cd3211]'}`}>[4] Logistics</button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Main Content Pane */}
        <div className="flex-[3] flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
          {viewMode === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {vault.rooms.map(room => (
                  <div key={room.id} className="border border-[#32cd3266] p-2 bg-[#32cd3205] group hover:bg-[#32cd320a] transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start text-[10px] mb-1">
                      <span className="font-bold text-[#32cd32] uppercase">{room.type} SECTOR V.{room.level}</span>
                      <span className={`${room.integrity < 30 ? 'text-red-500 animate-pulse' : 'opacity-50'}`}>COND: {room.integrity.toFixed(0)}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {vault.agents.filter(a => a.assignment.id === room.id).map(agent => (
                        <div key={agent.id} className="px-1.5 py-0.5 border border-[#32cd3233] text-[8px] bg-black text-[#32cd32]">
                          {agent.name.toUpperCase()} (Lvl {agent.level})
                        </div>
                      ))}
                      {vault.agents.filter(a => a.assignment.id === room.id).length === 0 && <span className="text-[8px] italic opacity-40">-- UNMANNED --</span>}
                    </div>
                    {/* Background indicator for integrity */}
                    <div className="absolute bottom-0 left-0 h-0.5 bg-red-900 w-full">
                       <div className="h-full bg-[#32cd32]" style={{ width: `${room.integrity}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'ROSTER' && (
            <div className="grid grid-cols-1 gap-2">
              {vault.agents.map(agent => (
                <div key={agent.id} className="border border-[#32cd3233] p-2 bg-black/40 flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-40">
                    <div className="font-bold text-[#32cd32] text-xs flex justify-between">
                       <span>{agent.name}</span>
                       <span className="opacity-50 text-[9px]">Lvl {agent.level}</span>
                    </div>
                    <div className="w-full h-1 bg-[#32cd3222] mt-1"><div className="h-full bg-blue-500" style={{ width: `${(agent.xp / (agent.level * 100)) * 100}%` }}></div></div>
                    <div className="text-[9px] uppercase opacity-50 mt-1">HP: {agent.hp.toFixed(0)}/{agent.maxHp}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {agent.traits.map(t => (
                        <div key={t} className="text-[7px] bg-[#32cd3222] px-1 border border-[#32cd3233]">{t}</div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {Object.entries(agent.skills).map(([sk, val]) => (
                      <div key={sk} className="text-center border border-[#32cd3211] py-1 bg-black/20">
                        <div className="text-[6px] uppercase opacity-60">{sk}</div>
                        <div className="text-[9px] font-bold">{val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="w-full md:w-32 flex flex-col justify-center">
                    <select 
                      className="bg-black border border-[#32cd3233] text-[9px] text-[#32cd32] p-1"
                      value={agent.assignment.id}
                      onChange={(e) => onAssign(agent.id, e.target.value)}
                    >
                      <option value="IDLE">-- STANDBY --</option>
                      {vault.rooms.map(r => <option key={r.id} value={r.id}>DEPL: {r.type}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'COMBAT' && (
            <div className="flex flex-col h-full gap-4">
              {!vault.activeAssault ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#32cd3233] opacity-30">
                   <div className="text-2xl mb-2 font-black tracking-tighter">NO ACTIVE ENGAGEMENT</div>
                   <div className="text-xs italic uppercase">Triangulate territory on the tactical map to deploy.</div>
                </div>
              ) : (
                <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
                  <div className="flex justify-between items-end border-b-2 border-[#32cd32] pb-2">
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-widest flicker">{vault.activeAssault.briefing.title}</h3>
                      <div className="text-[10px] opacity-60">TARGET: {vault.activeAssault.territoryName} // {vault.activeAssault.faction}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-1 justify-end mb-1">
                        {[1, 2, 3].map(w => (
                          <div 
                            key={w} 
                            className={`w-3 h-3 border border-[#32cd32] ${vault.activeAssault!.currentWave >= w ? 'bg-[#32cd32]' : 'bg-black'} ${vault.activeAssault!.currentWave === w ? 'animate-pulse' : ''}`}
                          ></div>
                        ))}
                      </div>
                      <div className="text-xs font-bold text-red-500 uppercase tracking-tighter">Wave {vault.activeAssault.currentWave}/3</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                      <div className="p-3 bg-[#32cd320a] border border-[#32cd3233] text-xs leading-relaxed italic border-l-4 border-l-[#32cd32] shadow-[inset_0_0_10px_rgba(50,205,50,0.05)]">
                        <span className="opacity-40 uppercase block mb-1 text-[8px] font-bold">Incoming Tactical SITREP:</span>
                        {vault.activeAssault.briefing.description}
                      </div>
                      
                      <div className="bg-black/90 border border-[#32cd3255] p-3 flex-1 flex flex-col gap-2 min-h-[250px] shadow-[0_0_20px_rgba(0,0,0,1)]">
                         <div className="text-[9px] uppercase border-b border-[#32cd3233] pb-1 font-bold flex justify-between">
                            <span>Field Communication Log // Encrypted</span>
                            <span className="animate-pulse text-red-500">CARRIER: ACTIVE</span>
                         </div>
                         <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar text-[11px] font-mono scroll-smooth">
                           {vault.activeAssault.waveLogs.map((log, i) => (
                             <div key={i} className="flex gap-2 animate-in slide-in-from-bottom-2 duration-700">
                               <span className="opacity-40 text-[9px] min-w-[50px] border-r border-[#32cd3222] mr-2">WAVE {i + 1}</span>
                               <span className="text-[#32cd32]/90 flex-1">{log}</span>
                             </div>
                           ))}
                           {isResolvingWave && (
                             <div className="flex gap-2">
                               <span className="opacity-20 text-[9px] min-w-[50px]">...</span>
                               <span className="animate-pulse text-[#32cd32] italic">Bouncing carrier signal off pre-war relay... SITREP pending...</span>
                             </div>
                           )}
                         </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-[#32cd3233] p-3 bg-black/60 shadow-lg">
                        <h4 className="text-[10px] font-bold uppercase mb-3 text-center border-b border-[#32cd3222] pb-1 tracking-widest">Strike Team</h4>
                        <div className="space-y-4">
                          {vault.activeAssault.team.map(aid => {
                            const agent = vault.agents.find(a => a.id === aid);
                            return (
                              <div key={aid} className="text-[10px] flex flex-col gap-1">
                                <div className="flex justify-between font-bold">
                                  <span>{agent?.name}</span>
                                  <span className="text-[8px] opacity-70">CBT: {agent?.skills.combat}</span>
                                </div>
                                <div className="flex justify-between items-center text-[8px] opacity-60">
                                   <span>HP: {agent?.hp.toFixed(0)}/{agent?.maxHp}</span>
                                </div>
                                <div className="w-full h-1 bg-black border border-[#32cd3233]">
                                  <div className={`h-full ${agent && agent.hp < 30 ? 'bg-red-600 animate-pulse' : 'bg-[#32cd32]'}`} style={{ width: `${agent?.hp}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                         {vault.activeAssault.status === 'SUCCESS' ? (
                           <div className="text-center p-6 bg-[#32cd3211] border-2 border-[#32cd32] shadow-[0_0_20px_rgba(50,205,50,0.2)] animate-in zoom-in duration-300">
                             <div className="text-2xl font-black tracking-tighter text-[#32cd32] flicker">SECTOR SECURED</div>
                             <div className="text-[9px] mt-2 uppercase tracking-widest border-t border-[#32cd3233] pt-2">Looting Faction Storage...</div>
                             <button onClick={onCancelAssault} className="mt-6 w-full py-3 bg-[#32cd32] text-black font-bold uppercase text-xs hover:scale-105 active:scale-95 transition-all">Extract Squad</button>
                           </div>
                         ) : vault.activeAssault.status === 'FAILED' ? (
                           <div className="text-center p-6 bg-red-950/40 border-2 border-red-600 shadow-[0_0_20px_rgba(255,0,0,0.2)] animate-in shake duration-500">
                             <div className="text-2xl font-black tracking-tighter text-red-600 flicker">MISSION ABORTED</div>
                             <div className="text-[9px] mt-2 uppercase opacity-70">Casualties reported // Evacuating...</div>
                             <button onClick={onCancelAssault} className="mt-6 w-full py-3 bg-red-600 text-black font-bold uppercase text-xs hover:bg-red-500 transition-all">Dismiss Dead/Injured</button>
                           </div>
                         ) : (
                           <>
                             <button 
                               onClick={handleWaveAction}
                               disabled={isResolvingWave}
                               className="w-full py-5 bg-[#32cd32] text-black font-black uppercase text-base shadow-[0_0_30px_rgba(50,205,50,0.4)] hover:brightness-110 active:scale-95 disabled:opacity-30 transition-all border-b-4 border-black/30"
                             >
                               {isResolvingWave ? 'ENGAGING...' : `EXECUTE WAVE ${vault.activeAssault.currentWave}`}
                             </button>
                             <div className="text-[8px] opacity-40 text-center uppercase tracking-widest font-bold">Target Stability: {vault.activeAssault.briefing.stabilityImpact} Impact Expected</div>
                             <button 
                               onClick={onCancelAssault}
                               className="w-full py-1 text-[8px] border border-red-900 text-red-500 uppercase hover:bg-red-900 hover:text-white transition-all mt-4 opacity-50 hover:opacity-100"
                             >
                               Tactical Retreat [Wipe Progress]
                             </button>
                           </>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'MISSIONS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vault.availableMissions.map(m => (
                  <div key={m.id} className="border border-[#32cd3244] p-3 bg-black/60 group hover:border-[#32cd32aa] transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#32cd32] uppercase">{m.name}</span>
                      <span className="text-[8px] bg-[#32cd3222] px-1 border border-[#32cd3233]">REQ: {m.requiredSkill.toUpperCase()} {m.difficulty}</span>
                    </div>
                    <p className="text-[10px] opacity-70 mb-4 leading-tight italic">"{m.description}"</p>
                    <div className="flex justify-between items-end">
                       <div className="text-[8px] opacity-50 uppercase">Duration: {m.duration} ticks</div>
                       <button 
                        onClick={() => {
                          if(selectedAgents.length > 0) {
                            onStartMission(m, selectedAgents);
                            setSelectedAgents([]);
                          }
                        }}
                        disabled={selectedAgents.length === 0}
                        className="px-4 py-1.5 bg-[#32cd32] text-black text-[9px] font-bold uppercase disabled:opacity-20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Launch Mission ({selectedAgents.length})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {vault.activeMissions.length > 0 && (
                <div className="mt-6 border-t border-[#32cd3233] pt-4">
                   <h4 className="text-[10px] font-bold uppercase mb-3 opacity-60 tracking-widest">Active Operations</h4>
                   <div className="space-y-2">
                      {vault.activeMissions.map(am => (
                        <div key={am.missionId} className="border border-[#32cd3222] p-2 bg-[#32cd3205] flex justify-between items-center">
                           <div className="text-[10px]">{am.name}</div>
                           <div className="flex items-center gap-4">
                              <div className="text-[8px] opacity-50 uppercase">ETA: {am.remainingTicks}t</div>
                              <div className="w-24 h-1 bg-black"><div className="h-full bg-blue-500 animate-pulse" style={{ width: `${(1 - (am.remainingTicks / (vault.availableMissions.find(m => m.id === am.missionId)?.duration || 1))) * 100}%` }}></div></div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Log & Personnel Selector */}
        <div className="flex-1 flex flex-col gap-3 min-w-[240px]">
          <div className="flex-1 border border-[#32cd3233] bg-black/80 flex flex-col min-h-0 shadow-xl">
             <div className="text-[9px] p-2 border-b border-[#32cd3222] uppercase opacity-60 flex justify-between font-bold bg-[#32cd3205]">
                <span>Strand Event Log</span>
                <span>Day {vault.day} // {vault.season}</span>
             </div>
             <div className="flex-1 overflow-y-auto p-2 text-[9px] space-y-2 font-mono leading-tight custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                {vault.eventLog.slice().reverse().map((l, i) => {
                  const parts = l.split(']');
                  return (
                    <div key={i} className="animate-in slide-in-from-left duration-300 flex gap-1">
                      <span className="opacity-40 font-bold shrink-0">{parts[0]}]</span>
                      <span className="text-[#32cd32]/90">{parts[1]}</span>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className="border border-[#32cd32] p-4 bg-[#32cd3211] shadow-[0_0_20px_rgba(50,205,50,0.1)]">
            <h5 className="text-[10px] font-bold uppercase mb-3 border-b border-[#32cd3222] pb-1 tracking-widest text-center">Unit Deployment</h5>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                {vault.agents.filter(a => a.assignment.type === 'IDLE').map(a => (
                  <button 
                    key={a.id}
                    onClick={() => toggleAgentForMission(a.id)}
                    className={`px-2 py-1 text-[9px] border transition-all ${selectedAgents.includes(a.id) ? 'bg-[#32cd32] text-black border-[#32cd32] font-bold' : 'border-[#32cd3244] text-[#32cd32] hover:bg-[#32cd3222]'}`}
                  >
                    {a.name}
                  </button>
                ))}
                {vault.agents.filter(a => a.assignment.type === 'IDLE').length === 0 && (
                  <div className="text-[9px] italic opacity-40 w-full text-center py-2">All personnel deployed.</div>
                )}
            </div>
            {selectedAgents.length > 0 && (
              <div className="mt-3 text-[10px] uppercase font-black text-center border-t border-[#32cd3244] pt-2 animate-pulse">
                {selectedAgents.length} Operatives Selected
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

// Helper to estimate current production for UI
function roomProductionOf(vault: any, resource: string): number {
  let total = 0;
  vault.rooms.forEach((room: any) => {
    const config = (PRODUCTION_RATES as any)[room.type];
    if (config && config.resource === resource) {
      const staff = vault.agents.filter((a: any) => a.assignment.id === room.id);
      const efficiency = staff.reduce((acc: number, a: any) => acc + (a.skills[config.skill] || 0), 0) / 100;
      total += efficiency * config.rate * room.level;
    }
  });
  return total;
}

export default VaultView;
