
import React, { useState } from 'react';
import { Agent, Room, VaultResources, ActiveMission, Mission, GameState, Challenge, HydroSlot, AssaultState } from '../types';

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
          <div key={res} className="border border-[#32cd3255] p-1 bg-black/60 text-center shadow-[inset_0_0_5px_rgba(50,205,50,0.1)]">
            <div className="text-[7px] opacity-60 uppercase tracking-tighter">{res}</div>
            <div className={`text-[10px] font-bold ${val < 5 ? 'text-red-500 animate-pulse' : 'text-[#32cd32]'}`}>
              {val.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-Tabs */}
      <div className="flex gap-2 mb-1 border-b border-[#32cd3233]">
        <button onClick={() => setViewMode('OVERVIEW')} className={`px-3 py-1 text-[10px] uppercase ${viewMode === 'OVERVIEW' ? 'bg-[#32cd32] text-black font-bold' : 'text-[#32cd32] hover:bg-[#32cd3211]'}`}>[1] Overview</button>
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
                  <div key={room.id} className="border border-[#32cd3266] p-2 bg-[#32cd3205] group hover:bg-[#32cd320a] transition-all">
                    <div className="flex justify-between items-start text-[10px] mb-1">
                      <span className="font-bold text-[#32cd32] uppercase">{room.type} SECTOR V.{room.level}</span>
                      <span className="opacity-50">COND: {room.integrity}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {room.staff.map(sid => {
                        const agent = vault.agents.find(a => a.id === sid);
                        return (
                          <div key={sid} className="px-1.5 py-0.5 border border-[#32cd3233] text-[8px] bg-black text-[#32cd32]">
                            {agent?.name.toUpperCase()}
                          </div>
                        );
                      })}
                      {room.staff.length === 0 && <span className="text-[8px] italic opacity-40">-- EMPTY --</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hydroponics mini-view */}
              <div className="border border-[#32cd3244] p-2 bg-black/40">
                <h4 className="text-[9px] font-bold uppercase mb-2 opacity-60">Hydro-Feed Status</h4>
                <div className="flex gap-2">
                  {vault.hydroponics.map(slot => (
                    <div key={slot.id} className="flex-1 border border-[#32cd3222] p-1 text-center">
                      <div className="text-[8px] truncate">{slot.cropType}</div>
                      <div className="w-full h-1 bg-black mt-1"><div className="h-full bg-[#32cd32]" style={{ width: `${slot.growth}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'ROSTER' && (
            <div className="grid grid-cols-1 gap-2">
              {vault.agents.map(agent => (
                <div key={agent.id} className="border border-[#32cd3233] p-2 bg-black/40 flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-32">
                    <div className="font-bold text-[#32cd32] text-xs">{agent.name}</div>
                    <div className="text-[9px] uppercase opacity-50">KARMA: {agent.karma}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {agent.traits.map(t => (
                        <div key={t} className="text-[7px] bg-[#32cd3222] px-1 border border-[#32cd3233]">{t}</div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {Object.entries(agent.skills).map(([sk, val]) => (
                      <div key={sk} className="text-center border border-[#32cd3211] py-1">
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
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#32cd3233] opacity-50">
                   <div className="text-2xl mb-2">NO ACTIVE ENGAGEMENT</div>
                   <div className="text-xs italic uppercase">Scan the Map for high-value targets.</div>
                </div>
              ) : (
                <div className="flex flex-col h-full gap-4">
                  <div className="flex justify-between items-end border-b-2 border-[#32cd32] pb-2">
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-widest">{vault.activeAssault.briefing.title}</h3>
                      <div className="text-[10px] opacity-60">TARGET: {vault.activeAssault.territoryName} // {vault.activeAssault.faction}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-red-500">WAVE {vault.activeAssault.currentWave}/3</div>
                      <div className="text-[9px]">DIFFICULTY: {vault.activeAssault.briefing.difficulty}/10</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                      <div className="p-3 bg-black border border-[#32cd3233] text-xs leading-relaxed italic">
                        "{vault.activeAssault.briefing.description}"
                      </div>
                      
                      <div className="bg-black/80 border border-[#32cd3255] p-3 flex-1 flex flex-col gap-2 min-h-[200px]">
                         <div className="text-[9px] uppercase border-b border-[#32cd3233] pb-1 font-bold">Field Communication Log</div>
                         <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar text-[11px]">
                           {vault.activeAssault.waveLogs.map((log, i) => (
                             <div key={i} className="flex gap-2 animate-in fade-in duration-700">
                               <span className="opacity-40 text-[9px]">[WAVE {i + 1}]</span>
                               <span>{log}</span>
                             </div>
                           ))}
                           {isResolvingWave && <div className="animate-pulse text-[#32cd32]">Bouncing carrier signal... awaiting SITREP...</div>}
                         </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-[#32cd3233] p-2 bg-[#32cd3205]">
                        <h4 className="text-[10px] font-bold uppercase mb-2 text-center border-b border-[#32cd3222]">Deployed Squad</h4>
                        <div className="space-y-2">
                          {vault.activeAssault.team.map(aid => {
                            const agent = vault.agents.find(a => a.id === aid);
                            return (
                              <div key={aid} className="text-[10px] flex justify-between items-center">
                                <span>{agent?.name}</span>
                                <div className="w-20 h-1.5 bg-black border border-[#32cd3233]">
                                  <div className="h-full bg-[#32cd32]" style={{ width: `${agent?.hp}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                         {vault.activeAssault.status === 'SUCCESS' ? (
                           <div className="text-center p-4 bg-[#32cd3233] border border-[#32cd32] animate-bounce">
                             <div className="text-xl font-bold">SECTOR SECURED</div>
                             <div className="text-[10px] mt-1 uppercase">Rewards Distributed to Vault</div>
                             <button onClick={onCancelAssault} className="mt-4 w-full py-2 bg-[#32cd32] text-black font-bold uppercase text-xs">Return to Roster</button>
                           </div>
                         ) : vault.activeAssault.status === 'FAILED' ? (
                           <div className="text-center p-4 bg-red-900/30 border border-red-500">
                             <div className="text-xl font-bold text-red-500">MISSION FAILED</div>
                             <div className="text-[10px] mt-1 uppercase">Squad forced to withdraw</div>
                             <button onClick={onCancelAssault} className="mt-4 w-full py-2 bg-red-500 text-black font-bold uppercase text-xs">Dismiss SQUAD</button>
                           </div>
                         ) : (
                           <>
                             <button 
                               onClick={handleWaveAction}
                               disabled={isResolvingWave}
                               className="w-full py-4 bg-[#32cd32] text-black font-bold uppercase text-sm shadow-[0_0_20px_rgba(50,205,50,0.3)] hover:brightness-110 disabled:opacity-50"
                             >
                               {isResolvingWave ? 'Transmitting...' : `EXECUTE WAVE ${vault.activeAssault.currentWave}`}
                             </button>
                             <button 
                               onClick={onCancelAssault}
                               className="w-full py-1 text-[9px] border border-red-900 text-red-500 uppercase hover:bg-red-900 hover:text-white transition-all"
                             >
                               Abort Mission [LOSE ALL PROGRESS]
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
                  <div key={m.id} className="border border-[#32cd3244] p-2 bg-black/60 group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-[#32cd32]">{m.name}</span>
                      <span className="text-[8px] opacity-60">REQ: {m.requiredSkill.toUpperCase()} {m.difficulty}</span>
                    </div>
                    <p className="text-[9px] opacity-80 mb-2 leading-tight h-8 overflow-hidden">{m.description}</p>
                    <button 
                      onClick={() => {
                        if(selectedAgents.length > 0) {
                          onStartMission(m, selectedAgents);
                          setSelectedAgents([]);
                        }
                      }}
                      disabled={selectedAgents.length === 0}
                      className="w-full py-1 bg-[#32cd32] text-black text-[9px] font-bold uppercase disabled:opacity-30"
                    >
                      Assign Selected ({selectedAgents.length})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Log & Personnel Selector */}
        <div className="flex-1 flex flex-col gap-3 min-w-[220px]">
          <div className="flex-1 border border-[#32cd3233] bg-black/80 flex flex-col min-h-0">
             <div className="text-[9px] p-1 border-b border-[#32cd3222] uppercase opacity-60 flex justify-between">
                <span>Event Log</span>
                <span>TICK: {vault.tick}</span>
             </div>
             <div className="flex-1 overflow-y-auto p-2 text-[8px] space-y-1 font-mono leading-tight custom-scrollbar">
                {vault.eventLog.slice().reverse().map((l, i) => (
                    <div key={i} className="mb-1">
                      <span className="opacity-40">[{l.split(']')[0]}]</span>
                      <span className="text-[#32cd32]/90 ml-1">{l.split(']')[1]}</span>
                    </div>
                ))}
             </div>
          </div>

          <div className="border border-[#32cd32] p-3 bg-[#32cd3211] shadow-[0_0_15px_rgba(50,205,50,0.1)]">
            <h5 className="text-[9px] font-bold uppercase mb-2">Personnel Selector</h5>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                {vault.agents.filter(a => a.assignment.type === 'IDLE').map(a => (
                  <button 
                    key={a.id}
                    onClick={() => toggleAgentForMission(a.id)}
                    className={`px-1.5 py-0.5 text-[8px] border ${selectedAgents.includes(a.id) ? 'bg-[#32cd32] text-black border-[#32cd32]' : 'border-[#32cd3233] text-[#32cd32]'}`}
                  >
                    {a.name}
                  </button>
                ))}
                {vault.agents.filter(a => a.assignment.type === 'IDLE').length === 0 && (
                  <div className="text-[8px] italic opacity-40">No available agents.</div>
                )}
            </div>
            {selectedAgents.length > 0 && (
              <div className="mt-2 text-[8px] uppercase font-bold text-center">
                {selectedAgents.length} Squad Members Selected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultView;
