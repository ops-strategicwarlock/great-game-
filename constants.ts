
import { Faction, Territory } from './types';

export const INITIAL_TERRITORIES: Territory[] = [
  { id: '1', name: 'Downtown Bakersfield', hostility: 0.7, owner: Faction.NCR, lastClaimed: new Date(), revenue: 1.5, stability: 80 },
  { id: '2', name: 'Industrial Sector South', hostility: 0.9, owner: Faction.ENCLAVE, lastClaimed: new Date(), revenue: 2.1, stability: 95 },
  { id: '3', name: 'Necropolis Ruins', hostility: 0.5, owner: Faction.BROTHERHOOD, lastClaimed: new Date(), revenue: 1.1, stability: 60 },
  { id: '4', name: 'Oildale Frontier', hostility: 0.4, owner: Faction.HOUSE, lastClaimed: new Date(), revenue: 0.8, stability: 100 },
  { id: '5', name: 'Kern River Outpost', hostility: 0.6, owner: Faction.NCR, lastClaimed: new Date(), revenue: 1.3, stability: 40 },
  { id: '6', name: 'Buck Owens Memorial', hostility: 0.3, owner: Faction.INDEPENDENT, lastClaimed: new Date(), revenue: 0.5, stability: 30 }
];

export const FACTION_COLORS: Record<Faction, string> = {
  [Faction.NCR]: '#ffd700',
  [Faction.BROTHERHOOD]: '#c0c0c0',
  [Faction.ENCLAVE]: '#4169e1',
  [Faction.HOUSE]: '#ff4500',
  [Faction.INDEPENDENT]: '#32cd32'
};

export const CROP_DATA = {
  'STIM-WORT': { growthDays: 4, yield: { meds: 5 }, season: ['RAD-BLOOM', 'ASH-FALL'] },
  'GLOW-GRAIN': { growthDays: 6, yield: { food: 20 }, season: ['SOLAR-FLARE'] },
  'IRON-STALK': { growthDays: 8, yield: { parts: 15 }, season: ['RAD-BLOOM', 'SOLAR-FLARE', 'ASH-FALL'] },
  'EMPTY': { growthDays: 0, yield: {}, season: [] }
};

export const FACTION_ENCOUNTERS = {
  [Faction.NCR]: {
    encounters: ['NCR Patrol Unit', 'Settler Dispute', 'Tax Collector Standoff', 'Supply Line Blockade'],
    focus: 'Bureaucracy, supplies, and low-morale rangers.',
    rewards: ['CAPS', 'REPUTATION']
  },
  [Faction.ENCLAVE]: {
    encounters: ['Robotic Security Checkpoint', 'Radiation Anomaly', 'Vertibird Recon Flight', 'X-01 Squad Ambush'],
    focus: 'High-tech terror, pre-war superiority, and genetic purity.',
    rewards: ['TECH', 'PARTS']
  },
  [Faction.BROTHERHOOD]: {
    encounters: ['Scribe Field Research', 'Paladin Sentry', 'Tech Salvage Operation', 'Initiate Trial'],
    focus: 'Technology hoarding, laser discipline, and isolationism.',
    rewards: ['PARTS', 'INTEL']
  },
  [Faction.HOUSE]: {
    encounters: ['Securitron Mk II Patrol', 'Automated Courier Node', 'Corporate Asset Audit'],
    focus: 'Automated efficiency, mathematical coldness, and Vegas logic.',
    rewards: ['CAPS', 'INTEL']
  },
  [Faction.INDEPENDENT]: {
    encounters: ['Raider Ambush', 'Feral Swarm', 'Wasteland Drifter Dispute', 'Mutant Nest'],
    focus: 'Chaos, survival, and lawless brutality.',
    rewards: ['PARTS', 'FOOD']
  }
};

// Vault room production rates and resource logic
export const PRODUCTION_RATES: Record<string, any> = {
  POWER: { resource: 'power', skill: 'mining', rate: 0.05 },
  HYDRO: { resource: 'food', skill: 'farming', rate: 0.04, consumes: { water: 0.02, power: 0.01 } },
  NETWORK: { resource: 'intel', skill: 'intel', rate: 0.02 },
  MEDBAY: { resource: 'meds', skill: 'tech', rate: 0.01, healRate: 0.5 },
  MAINTENANCE: { resource: 'parts', skill: 'tech', rate: 0.01, repairRate: 0.1 }
};
