
export enum Faction {
  NCR = 'NCR',
  BROTHERHOOD = 'BOS',
  ENCLAVE = 'ENCLAVE',
  HOUSE = 'HOUSE',
  INDEPENDENT = 'IND'
}

export enum NFTClass {
  STRAND_ARTIFACT = 'STRAND_ARTIFACT',
  TERRITORY_CLAIM = 'TERRITORY_CLAIM',
  INT_LOADOUT = 'INT_LOADOUT',
  FACTION_DEED = 'FACTION_DEED',
  ECHO_MEMORY = 'ECHO_MEMORY'
}

export enum Season {
  RAD_BLOOM = 'RAD-BLOOM', 
  SOLAR_FLARE = 'SOLAR-FLARE', 
  ASH_FALL = 'ASH-FALL', 
  NUCLEAR_WINTER = 'NUCLEAR-WINTER' 
}

export interface LogEntry {
  text: string;
  timestamp: string;
}

export interface HydroSlot {
  id: string;
  cropType: 'STIM-WORT' | 'GLOW-GRAIN' | 'IRON-STALK' | 'EMPTY';
  growth: number; 
  daysRemaining: number;
}

export interface Territory {
  id: string;
  name: string;
  hostility: number;
  owner: Faction;
  lastClaimed: Date;
  revenue: number;
  stability: number; // 0 to 100
}

export interface NFTItem {
  id: string;
  type: NFTClass;
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  durability?: number;
  data?: any;
}

export interface Agent {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  xp: number;
  level: number;
  traits: string[];
  karma: number;
  skills: {
    farming: number;
    mining: number;
    combat: number;
    intel: number;
    tech: number;
  };
  assignment: {
    type: 'IDLE' | 'ROOM' | 'MISSION' | 'COMBAT';
    id: string;
  };
}

export interface Room {
  id: string;
  type: 'HYDRO' | 'MAINTENANCE' | 'NETWORK' | 'POWER' | 'MEDBAY';
  level: number;
  integrity: number;
  staff: string[]; 
}

export interface VaultResources {
  power: number;
  water: number;
  food: number;
  meds: number;
  parts: number;
  intel: number;
  caps: number;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  requiredSkill: keyof Agent['skills'];
  duration: number;
  rewards: Partial<VaultResources>;
}

export interface ActiveMission {
  missionId: string;
  name: string;
  remainingTicks: number;
  team: string[];
}

export interface Challenge {
  id: string;
  title: string;
  requirement: string;
  progress: number;
  goal: number;
  completed: boolean;
}

export interface AssaultState {
  territoryId: string;
  territoryName: string;
  faction: Faction;
  briefing: {
    title: string;
    description: string;
    enemyType: string;
    difficulty: number;
    rewardEstimate: string;
    stabilityImpact: number;
    uniqueRewardType: 'INTEL' | 'PARTS' | 'CAPS' | 'REPUTATION';
  };
  currentWave: number;
  waveLogs: string[];
  team: string[];
  status: 'READY' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
}

export interface GameState {
  playerFaction: Faction;
  reputation: number;
  solBalance: number;
  territories: Territory[];
  inventory: NFTItem[];
  currentLocation: { lat: number; lng: number } | null;
  
  vault: {
    tick: number;
    day: number;
    season: Season;
    agents: Agent[];
    rooms: Room[];
    hydroponics: HydroSlot[];
    resources: VaultResources;
    activeMissions: ActiveMission[];
    availableMissions: Mission[];
    challenges: Challenge[];
    morale: number;
    eventLog: string[];
    activeAssault: AssaultState | null;
  };
}
