
import { Faction, Territory } from './types';

export const INITIAL_TERRITORIES: Territory[] = [
  { id: '1', name: 'Downtown Bakersfield', hostility: 0.7, owner: Faction.NCR, lastClaimed: new Date(), revenue: 1.5 },
  { id: '2', name: 'Industrial Sector South', hostility: 0.9, owner: Faction.ENCLAVE, lastClaimed: new Date(), revenue: 2.1 },
  { id: '3', name: 'Necropolis Ruins', hostility: 0.5, owner: Faction.BROTHERHOOD, lastClaimed: new Date(), revenue: 1.1 },
  { id: '4', name: 'Oildale Frontier', hostility: 0.4, owner: Faction.HOUSE, lastClaimed: new Date(), revenue: 0.8 },
  { id: '5', name: 'Kern River Outpost', hostility: 0.6, owner: Faction.NCR, lastClaimed: new Date(), revenue: 1.3 },
  { id: '6', name: 'Buck Owens Memorial', hostility: 0.3, owner: Faction.INDEPENDENT, lastClaimed: new Date(), revenue: 0.5 }
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
