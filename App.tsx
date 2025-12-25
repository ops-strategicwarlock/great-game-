
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import MapInterface from './components/MapInterface';
import InventoryView from './components/InventoryView';
import CombatLog from './components/CombatLog';
import VaultView from './components/VaultView';
import { INITIAL_TERRITORIES, CROP_DATA, PRODUCTION_RATES } from './constants';
import { GameState, Territory, Faction, NFTClass, NFTItem, LogEntry, Season, HydroSlot, Mission, AssaultState, Agent, Room } from './types';
import { 
  performWastelandSearch, 
  generateTacticalBriefing, 
  generateCombatWave,
  generateLocalizedLore,
  speakBroadcast
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
        { id: 'r5', type: 'MEDBAY', level: 1, integrity: 100, staff: [] },
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

  // OSINT State
  const [osintQuery, setOsintQuery] = useState('');
  const [osintResult, setOsintResult] = useState<{ text: string; sources: any[] } | null>(null);
  const [isOsintSearching, setIsOsintSearching] = useState(false);

  // Radio State
  const [radioStats, setRadioStats] = useState({
    songEnergy: 50,
    speed: 12.5,
    isLateNight: false,
    bassHeavy: false
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCombatLogs(prev => [...prev, { text: msg, timestamp }]);
  }, []);

  const handleLoreScan = () => {
    setIsScanning(true);
    setScanResult(null);
    addLog("SCANNER: Triangulating local carrier waves via Maps Grounding...");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await generateLocalizedLore(latitude, longitude);
          setScanResult(result);
          addLog(`SCANNER: Echo Memory localized in ${result.environment} zone.`);
        } catch (e) {
          addLog("SCANNER ERROR: Decryption failed.");
        } finally {
          setIsScanning(false);
        }
      }, () => {
        addLog("SCANNER ERROR: GPS Perms Denied.");
        setIsScanning(false);
      });
    }
  };

  const handlePlayBroadcast = async () => {
    const host = getRadioHost();
    setIsBroadcasting(true);
    try {
      const audioData = await speakBroadcast(host.line);
      if (audioData) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binaryString = atob(audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        source.onended = () => setIsBroadcasting(false);
      } else {
        setIsBroadcasting(false);
      }
    } catch (e) {
      console.error(e);
      setIsBroadcasting(false);
    }
  };

  const handleMintNFT = (result: any) => {
    if (gameState.solBalance < 0.5) {
      addLog("MINT FAILED: Insufficient SOL balance.");
      return;
    }
    const newItem: NFTItem = {
      id: `nft-${Date.now()}`,
      type: NFTClass.ECHO_MEMORY,
      name: result.title,
      description: result.fragment,
      rarity: result.rarity,
    };
    setGameState(prev => ({
      ...prev,
      solBalance: prev.solBalance - 0.5,
      inventory: [...prev.inventory, newItem]
    }));
    addLog(`MINT SUCCESS: '${result.title}' archived to local vault.`);
    setScanResult(null);
  };

  const handleRecon = async () => {
    if (!selectedTerritory) return;
    setIsReconning(true);
    addLog(`DASHBOARD: Analyzing ${selectedTerritory.owner} stability at ${selectedTerritory.name}...`);
    try {
      const brief = await generateTacticalBriefing(selectedTerritory.name, selectedTerritory.owner);
      setTacticalBrief(brief);
      addLog(`RECON COMPLETE: SITREP generated. Encounter: ${brief.title}. Threat: ${brief.enemyType}. Impact: -${brief.stabilityImpact} Stability.`);
    } catch (e) {
      addLog("RECON FAILED: Signal Jammed.");
    } finally {
      setIsReconning(false);
    }
  };

  const handleOsintSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osintQuery.trim() || isOsintSearching) return;

    setIsOsintSearching(true);
    setOsintResult(null);
    addLog(`OSINT: Querying pre-war archives for "${osintQuery}"...`);

    try {
      const result = await performWastelandSearch(osintQuery);
      setOsintResult(result);
      addLog("OSINT: Intelligence report retrieved successfully.");
    } catch (e) {
      addLog("OSINT ERROR: Archive link severed or access denied.");
      console.error(e);
    } finally {
      setIsOsintSearching(false);
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
        eventLog: [...prev.vault.eventLog, `[COMBAT] Assault team dispatched to ${selectedTerritory.name}. Target: ${tacticalBrief.title}.`]
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
        
        // Performance calculation
        const totalCombatSkill = ass.team.reduce((acc, aid) => {
          const agent = v.agents.find(a => a.id === aid);
          return acc + (agent?.skills.combat || 0);
        }, 0);
        
        const avgCombatSkill = totalCombatSkill / ass.team.length;
        const difficultyFactor = ass.briefing.difficulty * 10;
        const performanceBonus = (avgCombatSkill - difficultyFactor) / 100;
        const baseSuccessChance = 0.6 + performanceBonus;
        const roll = Math.random();

        if (roll < baseSuccessChance) {
          const xpGain = 15 + Math.floor(Math.random() * 10);
          const karmaGain = roll < 0.2 ? 5 : 2;

          v.eventLog.push(`[COMBAT] Wave ${ass.currentWave} CLEAR. Team performance high.`);
          v.agents = v.agents.map(a => {
            if (ass.team.includes(a.id)) {
              return { 
                ...a, 
                xp: a.xp + xpGain, 
                karma: Math.min(100, a.karma + karmaGain),
                energy: Math.max(0, a.energy - 10)
              };
            }
            return a;
          });

          // Territorial Impact
          const stabilityDrain = ass.briefing.stabilityImpact;
          prev.territories = prev.territories.map(t => 
            t.id === ass.territoryId ? { ...t, stability: Math.max(0, t.stability - stabilityDrain) } : t
          );
          
          if (ass.currentWave >= 3) {
            ass.status = 'SUCCESS';
            v.eventLog.push(`[COMBAT] Final Result: ${ass.territoryName} SECURED. ${ass.faction} presence neutralized.`);
            
            const finalSITREP = `SUCCESS: Territory ${ass.territoryName} claimed by ${prev.playerFaction}.`;
            addLog(finalSITREP);

            prev.territories = prev.territories.map(t => 
              t.id === ass.territoryId ? { ...t, owner: prev.playerFaction, lastClaimed: new Date(), stability: 50 } : t
            );

            // Dynamic Rewards based on faction difficulty and type
            const rewardType = ass.briefing.uniqueRewardType;
            const multiplier = 1 + (ass.briefing.difficulty / 10);
            
            if (rewardType === 'CAPS') v.resources.caps += Math.floor(200 * multiplier);
            if (rewardType === 'PARTS') v.resources.parts += Math.floor(15 * multiplier);
            if (rewardType === 'INTEL') v.resources.intel += Math.floor(10 * multiplier);
            if (rewardType === 'REPUTATION') prev.reputation += Math.floor(5 * multiplier);

            v.eventLog.push(`[REWARDS] Sector loot: ${rewardType} archived (Performance Multiplier: x${multiplier.toFixed(1)}).`);
          } else {
            ass.currentWave += 1;
          }
        } else {
          v.eventLog.push(`[COMBAT] Wave ${ass.currentWave} SETBACK. Heavy fire encountered.`);
          v.agents = v.agents.map(a => {
            if (ass.team.includes(a.id)) {
              const damage = 20 + Math.random() * 30;
              const newHp = Math.max(0, a.hp - damage);
              return { ...a, hp: newHp, karma: Math.max(0, a.karma - 1) };
            }
            return a;
          });

          const wiped = ass.team.every(aid => (v.agents.find(a => a.id === aid)?.hp || 0) <= 0);
          if (wiped) {
            ass.status = 'FAILED';
            v.eventLog.push(`[COMBAT] MISSION FAILURE. All operatives neutralized at ${ass.territoryName}.`);
            addLog(`FAILURE: Assault on ${ass.territoryName} ended in total squad wipe.`);
          } else if (roll < 0.1) {
            ass.status = 'FAILED';
            v.eventLog.push(`[COMBAT] Tactical retreat executed. Sector ${ass.territoryName} remains unstable.`);
            addLog(`ABORTED: Squad withdrew from ${ass.territoryName} due to extreme pressure.`);
          }
        }

        return { ...prev, vault: { ...v, activeAssault: ass } };
      });
    } catch (e) {
      console.error(e);
      addLog("COMBAT ERROR: Neural link to squad severed.");
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

      // Base Consumption
      v.resources.power -= ticks * 0.05;
      v.resources.water -= ticks * 0.05;
      v.resources.food -= ticks * 0.05;

      // Room Production & Logic
      v.rooms.forEach(room => {
        const staff = v.agents.filter(a => a.assignment.id === room.id);
        const config = PRODUCTION_RATES[room.type];
        if (config && room.integrity > 10) {
          const efficiency = staff.reduce((acc, a) => acc + (a.skills[config.skill as keyof Agent['skills']] || 0), 0) / 100;
          const production = efficiency * config.rate * room.level * ticks;

          let canProduce = true;
          if (config.consumes) {
            Object.entries(config.consumes).forEach(([res, amt]: [string, any]) => {
              if (v.resources[res as keyof typeof v.resources] < amt * ticks) canProduce = false;
            });
          }

          if (canProduce) {
            if (config.consumes) {
              Object.entries(config.consumes).forEach(([res, amt]: [string, any]) => {
                v.resources[res as keyof typeof v.resources] -= amt * ticks;
              });
            }
            v.resources[config.resource as keyof typeof v.resources] += production;

            if (room.type === 'MEDBAY' && config.healRate) {
              staff.forEach(a => {
                const agentIdx = v.agents.findIndex(ag => ag.id === a.id);
                if (agentIdx !== -1) {
                   v.agents[agentIdx].hp = Math.min(v.agents[agentIdx].maxHp, v.agents[agentIdx].hp + (config.healRate * ticks));
                }
              });
            }
            if (room.type === 'MAINTENANCE' && config.repairRate) {
              const lowestIntegrityRoom = v.rooms.reduce((low, curr) => curr.integrity < low.integrity ? curr : low, v.rooms[0]);
              if (lowestIntegrityRoom.integrity < 100) {
                lowestIntegrityRoom.integrity = Math.min(100, lowestIntegrityRoom.integrity + (config.repairRate * ticks));
              }
            }
          }
        }
      });

      v.rooms.forEach(r => { r.integrity = Math.max(0, r.integrity - (ticks * 0.005)); });

      const oldDay = v.day;
      v.day = Math.floor(v.tick / 100) + 1;

      v.activeMissions = v.activeMissions.map(am => ({
        ...am,
        remainingTicks: Math.max(0, am.remainingTicks - ticks)
      })).filter(am => {
        if (am.remainingTicks <= 0) {
          v.eventLog.push(`[MISSION] ${am.name} completed.`);
          const mission = v.availableMissions.find(m => m.id === am.missionId);
          if (mission && mission.rewards) {
             Object.entries(mission.rewards).forEach(([res, amt]) => {
               v.resources[res as keyof typeof v.resources] += amt;
             });
          }
          v.agents = v.agents.map(a => 
            am.team.includes(a.id) ? { ...a, assignment: { type: 'IDLE', id: 'IDLE' }, xp: a.xp + 20 } : a
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
          hp: Math.min(a.maxHp, a.hp + (a.hp > 0 ? 5 : 0)) 
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

        prev.territories = prev.territories.map(t => ({
          ...t,
          stability: Math.max(10, t.stability - (t.hostility * 3))
        }));

        if (v.day % 28 === 0) {
          const seasons = Object.values(Season);
          const nextIdx = (seasons.indexOf(v.season) + 1) % seasons.length;
          v.season = seasons[nextIdx];
          v.eventLog.push(`[SEASON] Environmental shift: ${v.season}.`);
        }
      }

      v.agents.forEach(a => {
        if (a.xp >= a.level * 100) {
          a.level += 1;
          a.xp = 0;
          v.eventLog.push(`[PROMOTION] ${a.name} reached Rank ${a.level}.`);
          Object.keys(a.skills).forEach(k => {
            a.skills[k as keyof Agent['skills']] += Math.floor(Math.random() * 5) + 2;
          });
        }
      });

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

  const getRadioHost = () => {
    if (radioStats.isLateNight && radioStats.songEnergy > 70) {
      return { name: "DJ_MEATWAVE", line: "CONFIDENCE DETECTED" };
    }
    if (radioStats.isLateNight && radioStats.bassHeavy) {
      return { name: "SIGNAL_STATIC", line: "POOR CHOICES STATISTICALLY IMMINENT" };
    }
    return { name: "AUTOMATED_BROADCAST", line: "SCANNING FOR CARRIER SIGNAL... STATUS: NOMINAL." };
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} reputation={gameState.reputation} sol={gameState.solBalance}>
      {activeTab === 'MAP' && (
        <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
          <div className="flex-1">
            <MapInterface 
              territories={gameState.territories} 
              onSelect={(t) => { setSelectedTerritory(t); setTacticalBrief(null); setScanResult(null); }} 
              onScan={handleLoreScan} 
              isScanning={isScanning}
            />
          </div>
          <div className="w-full md:w-80 border-l border-[#32cd3233] pl-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            {scanResult && (
              <div className="p-4 border border-[#32cd32] bg-[#32cd3222] animate-in slide-in-from-right duration-300">
                <h3 className="text-sm font-bold text-[#32cd32] uppercase mb-2">{scanResult.title}</h3>
                <p className="text-[10px] italic mb-4">"{scanResult.fragment}"</p>
                <div className="text-[9px] mb-2 opacity-60">RARITY: {scanResult.rarity} | ENV: {scanResult.environment}</div>
                <button onClick={() => handleMintNFT(scanResult)} className="w-full py-2 bg-[#32cd32] text-black font-bold text-xs uppercase hover:brightness-110">Mint Artifact (0.5 SOL)</button>
              </div>
            )}
            {selectedTerritory && !scanResult && (
              <div className="p-4 border border-[#32cd32] bg-[#32cd3211]">
                <h3 className="text-xl font-bold uppercase">{selectedTerritory.name}</h3>
                <div className="text-[10px] opacity-60 mb-1 uppercase">OWNER: {selectedTerritory.owner}</div>
                <div className="text-[10px] uppercase mb-4">STABILITY: <span className={selectedTerritory.stability < 40 ? 'text-red-500 animate-pulse' : 'text-white'}>{selectedTerritory.stability}%</span></div>
                
                {!tacticalBrief ? (
                  <button 
                    onClick={handleRecon} 
                    disabled={isReconning}
                    className="w-full py-2 border border-[#32cd32] text-xs font-bold uppercase hover:bg-[#32cd3222] disabled:opacity-50"
                  >
                    {isReconning ? 'Analyzing Faction Stability...' : 'Initiate Tactical Recon'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs border-y border-[#32cd3233] py-2 italic text-[#32cd32]">
                      {tacticalBrief.title}: {tacticalBrief.description}
                    </div>
                    <div className="text-[9px] uppercase">
                      Threat: <span className="text-white">{tacticalBrief.enemyType}</span><br/>
                      Difficulty: <span className="text-white">{tacticalBrief.difficulty}/10</span><br/>
                      Reward Focus: <span className="text-[#32cd32]">{tacticalBrief.uniqueRewardType}</span>
                    </div>
                    
                    <div className="bg-black/60 p-2 border border-red-500/30">
                       <div className="text-[8px] uppercase mb-2 text-red-400">Deploy Assault Squad</div>
                       <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {gameState.vault.agents.filter(a => a.assignment.type === 'IDLE').map(a => (
                            <div key={a.id} className="text-[8px] p-1 border border-[#32cd3233] w-full flex justify-between">
                               <span>{a.name}</span> <span>CBT: {a.skills.combat}</span>
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

      {activeTab === 'OSINT' && (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
          <div className="border-b border-[#32cd3233] pb-2 flex justify-between items-center">
            <h2 className="text-xl font-bold uppercase tracking-widest flicker">Open Source Intelligence // Pre-War Archives</h2>
            <div className="text-[10px] opacity-40">CARRIER: osint-node-09</div>
          </div>
          
          <form onSubmit={handleOsintSearch} className="flex gap-2">
            <input 
              type="text" 
              value={osintQuery}
              onChange={(e) => setOsintQuery(e.target.value)}
              placeholder="Enter search parameters (e.g. 'NCR history', 'Enclave coordinates')..."
              className="flex-1 bg-black border border-[#32cd3266] p-2 text-sm text-[#32cd32] placeholder-[#32cd3244] focus:outline-none focus:border-[#32cd32]"
              disabled={isOsintSearching}
            />
            <button 
              type="submit"
              disabled={isOsintSearching || !osintQuery.trim()}
              className="px-6 py-2 bg-[#32cd32] text-black font-bold uppercase text-xs hover:brightness-110 disabled:opacity-30"
            >
              {isOsintSearching ? 'LINKING...' : 'EXECUTE SEARCH'}
            </button>
          </form>

          <div className="flex-1 border border-[#32cd3233] bg-black/60 p-4 overflow-y-auto custom-scrollbar relative">
            {!osintResult && !isOsintSearching && (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                <div className="text-4xl mb-4">AWAITING QUERY</div>
                <div className="text-[10px] uppercase">Unauthorized access to pre-war databases is a punishable offense.</div>
              </div>
            )}

            {isOsintSearching && (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-[#32cd3222] w-3/4"></div>
                <div className="h-4 bg-[#32cd3211] w-full"></div>
                <div className="h-4 bg-[#32cd3222] w-5/6"></div>
              </div>
            )}

            {osintResult && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {osintResult.text}
                </div>

                {osintResult.sources && osintResult.sources.length > 0 && (
                  <div className="border-t border-[#32cd3233] pt-4 mt-8">
                    <h4 className="text-[10px] font-bold uppercase mb-2 opacity-60">Attested Data Sources:</h4>
                    <div className="flex flex-wrap gap-2">
                      {osintResult.sources.map((chunk: any, idx: number) => {
                        const uri = chunk.web?.uri || chunk.maps?.uri;
                        const title = chunk.web?.title || chunk.maps?.title || uri;
                        if (!uri) return null;
                        return (
                          <a 
                            key={idx} 
                            href={uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[9px] px-2 py-1 border border-[#32cd3244] hover:bg-[#32cd3222] truncate max-w-[200px]"
                          >
                            [{idx + 1}] {title}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'COMM' && (
        <div className="h-full flex flex-col gap-8 p-4 bg-[#32cd3205]">
          <div className="flex justify-between items-center border-b border-[#32cd3233] pb-4">
            <div className="text-2xl font-bold tracking-widest flicker">SIGNAL: STABLE</div>
            <div className="text-[10px] opacity-40">CARRIER: tt-ω-multiverse-pipeline</div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-lg border-2 border-[#32cd32] p-8 bg-black shadow-[0_0_30px_#32cd3222] flex flex-col items-center">
              <div className="w-full h-40 bg-[#32cd320a] border border-[#32cd3233] mb-6 relative overflow-hidden flex flex-col items-center justify-center text-center p-4">
                <div className="z-10">
                  <div className="text-[10px] opacity-50 uppercase mb-2 tracking-widest">Active Frequency Node</div>
                  <div className="text-2xl font-black tracking-widest text-[#32cd32] flicker">{getRadioHost().name}</div>
                  <div className="text-xs mt-3 italic text-white/80 border-t border-[#32cd3222] pt-2">"{getRadioHost().line}"</div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#32cd3222]">
                   <div className="h-full bg-[#32cd32] animate-[pulse_2s_infinite]" style={{ width: `${radioStats.songEnergy}%` }}></div>
                </div>
              </div>

              <div className="w-full space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span>Signal Energy</span>
                    <span>{radioStats.songEnergy}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={radioStats.songEnergy} 
                    onChange={(e) => setRadioStats(p => ({ ...p, songEnergy: parseInt(e.target.value) }))}
                    className="w-full accent-[#32cd32] bg-black border border-[#32cd3233]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span>Carrier Speed (MHz)</span>
                    <span>{radioStats.speed.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="100" 
                    step="0.1"
                    value={radioStats.speed} 
                    onChange={(e) => setRadioStats(p => ({ ...p, speed: parseFloat(e.target.value) }))}
                    className="w-full accent-[#32cd32] bg-black border border-[#32cd3233]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setRadioStats(p => ({ ...p, isLateNight: !p.isLateNight }))} 
                    className={`px-4 py-2 border border-[#32cd32] text-xs font-bold transition-all uppercase ${radioStats.isLateNight ? 'bg-[#32cd32] text-black shadow-[0_0_15px_#32cd32]' : 'hover:bg-[#32cd3222]'}`}
                  >
                    [LATE NIGHT]
                  </button>
                  <button 
                    onClick={() => setRadioStats(p => ({ ...p, bassHeavy: !p.bassHeavy }))} 
                    className={`px-4 py-2 border border-[#32cd32] text-xs font-bold transition-all uppercase ${radioStats.bassHeavy ? 'bg-[#32cd32] text-black shadow-[0_0_15px_#32cd32]' : 'hover:bg-[#32cd3222]'}`}
                  >
                    [BASS HEAVY]
                  </button>
                </div>

                <button 
                  onClick={handlePlayBroadcast}
                  disabled={isBroadcasting}
                  className="w-full mt-4 py-4 bg-[#32cd32] text-black font-black uppercase text-sm hover:brightness-110 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_20px_#32cd3244]"
                >
                  {isBroadcasting ? 'RECEIVING CARRIER...' : '[RECEIVE BROADCAST]'}
                </button>
              </div>
            </div>
          </div>
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
