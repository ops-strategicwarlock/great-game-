
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import MapInterface from './components/MapInterface';
import InventoryView from './components/InventoryView';
import CombatLog from './components/CombatLog';
import VaultView from './components/VaultView';
import { INITIAL_TERRITORIES, CROP_DATA } from './constants';
import { GameState, Territory, Faction, NFTClass, NFTItem, LogEntry, Season, HydroSlot, Mission, AssaultState } from './types';
import { 
  performWastelandSearch, 
  generateTacticalBriefing, 
  generateCombatWave,
  generateLoreArtifact,
  generateLocalizedLore
} from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('MAP');
  const [gameState, setGameState] = useState<GameState>({
    playerFaction: Faction.NCR,
    reputation: 100,
    solBalance: 5.4,
    territories: INITIAL_TERRITORIES,
    inventory: [
      { id: 'init-1', type: NFTClass.FACTION_DEED, name: 'NCR Ranger Pledge', description: 'A formal pledge to the New California Republic.', rarity: 'COMMON' }
    ],
    currentLocation: null,
    vault: {
      tick: 0,
      day: 1,
      season: Season.RAD_BLOOM,
      agents: [
        { id: 'a1', name: 'Ronin-7', hp: 100, maxHp: 100, energy: 100, maxEnergy: 100, xp: 0, level: 1, traits: ['Stoic'], karma: 50, skills: { farming: 10, mining: 85, combat: 85, intel: 40, tech: 50 }, assignment: { type: 'IDLE', id: 'IDLE' } },
        { id: 'a2', name: 'Scribe Vax', hp: 100, maxHp: 100, energy: 100, maxEnergy: 100, xp: 0, level: 1, traits: ['Genius'], karma: 85, skills: { farming: 40, mining: 20, combat: 20, intel: 75, tech: 90 }, assignment: { type: 'IDLE', id: 'IDLE' } },
        { id: 'a3', name: 'Merc-X', hp: 100, maxHp: 100, energy: 100, maxEnergy: 100, xp: 0, level: 1, traits: ['Brutal'], karma: 10, skills: { farming: 5, mining: 30, combat: 95, intel: 10, tech: 20 }, assignment: { type: 'IDLE', id: 'IDLE' } },
      ],
      rooms: [
        { id: 'r1', type: 'POWER', level: 1, integrity: 100, staff: [] },
        { id: 'r2', type: 'HYDRO', level: 1, integrity: 100, staff: [] },
        { id: 'r3', type: 'NETWORK', level: 1, integrity: 100, staff: [] },
        { id: 'r4', type: 'MAINTENANCE', level: 1, integrity: 100, staff: [] },
      ],
      hydroponics: [
        { id: 's1', cropType: 'EMPTY', growth: 0, daysRemaining: 0 },
        { id: 's2', cropType: 'EMPTY', growth: 0, daysRemaining: 0 },
        { id: 's3', cropType: 'EMPTY', growth: 0, daysRemaining: 0 },
      ],
      resources: { power: 100, water: 100, food: 100, meds: 10, parts: 20, intel: 0, caps: 500 },
      activeMissions: [],
      availableMissions: [
        { id: 'm1', name: 'Scavenge Ruins', description: 'Search for pre-war electronics.', difficulty: 3, requiredSkill: 'tech', duration: 15, rewards: { parts: 10, intel: 5 } }
      ],
      challenges: [
        { id: 'c1', title: 'Power Surge', requirement: 'Produce 500 Power', progress: 100, goal: 500, completed: false },
        { id: 'c2', title: 'First Harvest', requirement: 'Harvest 5 Crops', progress: 0, goal: 5, completed: false }
      ],
      morale: 75,
      eventLog: ['Strand OS v1.0 Kernel Booted.'],
      activeAssault: null
    }
  });

  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [tacticalBrief, setTacticalBrief] = useState<any>(null);
  const [combatLogs, setCombatLogs] = useState<LogEntry[]>([]);
  const [isReconning, setIsReconning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCombatLogs(prev => [...prev, { text: msg, timestamp }]);
  }, []);

  const handleRecon = async () => {
    if (!selectedTerritory) return;
    setIsReconning(true);
    addLog(`DASHBOARD: Triangulating tactical data for ${selectedTerritory.name}...`);
    try {
      const brief = await generateTacticalBriefing(selectedTerritory.name, selectedTerritory.owner);
      setTacticalBrief(brief);
      addLog(`RECON COMPLETE: SITREP generated. Target: ${brief.enemyType}.`);
    } catch (e) {
      addLog("RECON FAILED: Decryption interference.");
    } finally {
      setIsReconning(false);
    }
  };

  const handleStartAssault = (team: string[]) => {
    if (!selectedTerritory || !tacticalBrief || team.length === 0) return;
    
    setGameState(prev => ({
      ...prev,
      vault: {
        ...prev.vault,
        activeAssault: {
          territoryId: selectedTerritory.id,
          territoryName: selectedTerritory.name,
          faction: selectedTerritory.owner,
          briefing: tacticalBrief,
          currentWave: 1,
          waveLogs: [],
          team: team,
          status: 'READY'
        },
        agents: prev.vault.agents.map(a => 
          team.includes(a.id) ? { ...a, assignment: { type: 'COMBAT' as any, id: selectedTerritory.id } } : a
        ),
        eventLog: [...prev.vault.eventLog, `[COMBAT] Assault team dispatched to ${selectedTerritory.name}.`]
      }
    }));
    setActiveTab('VAULT');
  };

  const handleEngageWave = async () => {
    const assault = gameState.vault.activeAssault;
    if (!assault) return;

    try {
      const narrative = await generateCombatWave(assault.briefing, assault.currentWave, assault.faction);
      
      setGameState(prev => {
        const v = { ...prev.vault };
        const ass = { ...v.activeAssault! };
        ass.status = 'IN_PROGRESS';
        ass.waveLogs.push(narrative);
        
        // Rolling for wave outcome
        const totalCombat = ass.team.reduce((acc, aid) => {
          const agent = v.agents.find(a => a.id === aid);
          return acc + (agent?.skills.combat || 0);
        }, 0);
        
        const successChance = (totalCombat / (ass.briefing.difficulty * 50)) * 0.7;
        const roll = Math.random();

        if (roll < successChance) {
          // Success Wave
          v.eventLog.push(`[COMBAT] Wave ${ass.currentWave} resolved: CLEAR.`);
          v.agents = v.agents.map(a => {
            if (ass.team.includes(a.id)) {
              return { ...a, xp: a.xp + 5, karma: Math.min(100, a.karma + 2) };
            }
            return a;
          });
          
          if (ass.currentWave >= 3) {
            ass.status = 'SUCCESS';
            v.eventLog.push(`[COMBAT] Mission Success at ${ass.territoryName}.`);
            v.resources.caps += 100;
            v.resources.parts += 5;
            // Capture territory
            prev.territories = prev.territories.map(t => 
              t.id === ass.territoryId ? { ...t, owner: prev.playerFaction, lastClaimed: new Date() } : t
            );
          } else {
            ass.currentWave += 1;
          }
        } else {
          // Wave Failure / Setback
          v.eventLog.push(`[COMBAT] Wave ${ass.currentWave} setback. Agents took damage.`);
          v.agents = v.agents.map(a => {
            if (ass.team.includes(a.id)) {
              const damage = 10 + Math.random() * 20;
              const newHp = Math.max(0, a.hp - damage);
              return { ...a, hp: newHp, karma: Math.max(0, a.karma - 1) };
            }
            return a;
          });

          const wiped = ass.team.every(aid => (v.agents.find(a => a.id === aid)?.hp || 0) <= 0);
          if (wiped) {
            ass.status = 'FAILED';
            v.eventLog.push(`[COMBAT] MISSION CRITICAL FAILURE. Squad eliminated.`);
          } else if (roll < 0.1) { // Forced withdrawal
            ass.status = 'FAILED';
            v.eventLog.push(`[COMBAT] Mission Aborted due to heavy fire.`);
          }
        }

        return { ...prev, vault: { ...v, activeAssault: ass } };
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelAssault = () => {
    setGameState(prev => {
      const ass = prev.vault.activeAssault;
      if (!ass) return prev;
      return {
        ...prev,
        vault: {
          ...prev.vault,
          activeAssault: null,
          agents: prev.vault.agents.map(a => 
            ass.team.includes(a.id) ? { ...a, assignment: { type: 'IDLE', id: 'IDLE' } } : a
          )
        }
      };
    });
  };

  const handleStep = useCallback((ticks: number) => {
    setGameState(prev => {
      const v = { ...prev.vault };
      v.tick += ticks;
      v.resources.power -= ticks * 0.1;
      
      const oldDay = v.day;
      v.day = Math.floor(v.tick / 100) + 1;

      v.activeMissions = v.activeMissions.map(am => ({
        ...am,
        remainingTicks: Math.max(0, am.remainingTicks - ticks)
      })).filter(am => {
        if (am.remainingTicks <= 0) {
          v.eventLog.push(`[MISSION] ${am.name} completed successfully.`);
          v.agents = v.agents.map(a => 
            am.team.includes(a.id) ? { ...a, assignment: { type: 'IDLE', id: 'IDLE' } } : a
          );
          return false;
        }
        return true;
      });
      
      if (v.day > oldDay) {
        v.eventLog.push(`[DAY ${v.day}] Synchronizing Strand data.`);
        v.agents = v.agents.map(a => ({
          ...a,
          energy: Math.min(a.maxEnergy, a.energy + 20),
          hp: Math.min(a.maxHp, a.hp + 5) // Passive healing
        }));
        v.hydroponics = v.hydroponics.map(slot => {
          if (slot.cropType !== 'EMPTY' && slot.daysRemaining > 0) {
            const nextDays = slot.daysRemaining - 1;
            const crop = CROP_DATA[slot.cropType];
            const nextGrowth = Math.min(100, ((crop.growthDays - nextDays) / crop.growthDays) * 100);
            return { ...slot, daysRemaining: nextDays, growth: nextGrowth };
          }
          return slot;
        });
        if (v.day % 28 === 0) {
          const seasons = Object.values(Season);
          const nextIdx = (seasons.indexOf(v.season) + 1) % seasons.length;
          v.season = seasons[nextIdx];
          v.eventLog.push(`[SEASON] Environmental shift: ${v.season}.`);
        }
      }
      return { ...prev, vault: v };
    });
  }, []);

  const handleAssignAgent = useCallback((agentId: string, roomId: string) => {
    setGameState(prev => {
      const agents = prev.vault.agents.map(a => 
        a.id === agentId ? { ...a, assignment: { type: roomId === 'IDLE' ? 'IDLE' : 'ROOM' as any, id: roomId } } : a
      );
      const rooms = prev.vault.rooms.map(r => {
        let staff = r.staff.filter(id => id !== agentId);
        if (r.id === roomId) staff.push(agentId);
        return { ...r, staff };
      });
      return { ...prev, vault: { ...prev.vault, agents, rooms } };
    });
  }, []);

  const handleStartMission = useCallback((mission: Mission, team: string[]) => {
    setGameState(prev => {
      const v = { ...prev.vault };
      v.activeMissions.push({ missionId: mission.id, name: mission.name, remainingTicks: mission.duration, team });
      v.agents = v.agents.map(a => team.includes(a.id) ? { ...a, assignment: { type: 'MISSION' as any, id: mission.id } } : a );
      v.eventLog.push(`[MISSION] Team dispatched for ${mission.name}.`);
      return { ...prev, vault: v };
    });
  }, []);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} reputation={gameState.reputation} sol={gameState.solBalance}>
      {activeTab === 'MAP' && (
        <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
          <div className="flex-1">
            <MapInterface 
              territories={gameState.territories} 
              onSelect={(t) => { setSelectedTerritory(t); setTacticalBrief(null); }} 
              onScan={() => {}} 
              isScanning={isScanning}
            />
          </div>
          <div className="w-full md:w-80 border-l border-[#32cd3233] pl-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            {selectedTerritory && (
              <div className="p-4 border border-[#32cd32] bg-[#32cd3211]">
                <h3 className="text-xl font-bold uppercase">{selectedTerritory.name}</h3>
                <div className="text-[10px] opacity-60 mb-4">OWNER: {selectedTerritory.owner}</div>
                
                {!tacticalBrief ? (
                  <button 
                    onClick={handleRecon} 
                    disabled={isReconning}
                    className="w-full py-2 border border-[#32cd32] text-xs font-bold uppercase hover:bg-[#32cd3222] disabled:opacity-50"
                  >
                    {isReconning ? 'Decrypting SITREP...' : 'Initiate Tactical Recon'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs border-y border-[#32cd3233] py-2 italic text-[#32cd32]">
                      {tacticalBrief.title}: {tacticalBrief.description}
                    </div>
                    <div className="text-[9px] uppercase">
                      Enemy: <span className="text-white">{tacticalBrief.enemyType}</span><br/>
                      Difficulty: <span className="text-white">{tacticalBrief.difficulty}/10</span>
                    </div>
                    
                    <div className="bg-black/60 p-2 border border-red-500/30">
                       <div className="text-[8px] uppercase mb-2">Deploy Assault Squad</div>
                       <div className="flex flex-wrap gap-1">
                          {gameState.vault.agents.filter(a => a.assignment.type === 'IDLE').map(a => (
                            <div key={a.id} className="text-[8px] p-1 border border-[#32cd3233]">
                               {a.name} ({a.skills.combat})
                            </div>
                          ))}
                       </div>
                       <button 
                        onClick={() => handleStartAssault(gameState.vault.agents.filter(a => a.assignment.type === 'IDLE').map(a => a.id))}
                        className="w-full mt-4 py-2 bg-red-900 text-white font-bold uppercase text-xs hover:bg-red-700"
                       >
                         Execute Assault
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <CombatLog logs={combatLogs} />
          </div>
        </div>
      )}

      {activeTab === 'COMM' && (
        <div className="h-full flex flex-col gap-8 p-4 bg-[#32cd3205] items-center justify-center">
          <div className="text-2xl font-bold tracking-widest flicker">SIGNAL: STABLE</div>
          <div className="text-xs opacity-50 uppercase">Broadcasting on Bakersfield Multiverse Pipeline</div>
        </div>
      )}

      {activeTab === 'INV' && <InventoryView items={gameState.inventory} />}
      
      {activeTab === 'VAULT' && (
        <VaultView 
          vault={gameState.vault} 
          onStep={handleStep} 
          onAssign={handleAssignAgent}
          onStartMission={handleStartMission}
          onPlant={() => {}}
          onHarvest={() => {}}
          onEngageWave={handleEngageWave}
          onCancelAssault={handleCancelAssault}
        />
      )}
    </Layout>
  );
};

export default App;
