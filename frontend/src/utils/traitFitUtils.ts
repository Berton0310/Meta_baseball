// Trait -> batting-slot fit suggestions and position-fit helpers used by the
// Tactical Dashboard (LineupBuilder). Chemistry level math lives in
// chemistryUtils.ts and is reused here, never re-implemented.

import traitsData from '../data/traits.json';
import { normalizeChemistry, getChemistryLevel } from './chemistryUtils';
import type { ChemistryType } from './chemistryUtils';

// --- Trait lookup (players.json stores trait names, mostly nameEn) ----------
const traitByName = new Map<string, any>();
(traitsData as any[]).forEach(trait => {
  traitByName.set(trait.nameEn, trait);
  if (trait.nameZh) traitByName.set(trait.nameZh, trait);
});

export const getTraitByName = (name: string): any | null => traitByName.get(name) || null;

export const hasTrait = (player: any, traitNameEn: string): boolean => {
  return (player?.traits || []).some((n: string) => {
    const trait = getTraitByName(n);
    return trait ? trait.nameEn === traitNameEn : n === traitNameEn;
  });
};

// --- Batting-order fit table (keyed by nameEn) -------------------------------
export interface BattingFit {
  slots: number[];   // recommended 1-based batting slots; empty when bench-only
  bench?: boolean;   // trait works best from the bench (BN slots)
}

export const TRAIT_BATTING_FIT: Record<string, BattingFit> = {
  'RBI Hero': { slots: [3, 4, 5] },
  'Rally Starter': { slots: [1] },
  'Tough Out': { slots: [1, 2] },
  'First Pitch Slayer': { slots: [1, 2, 3, 4, 5] }, // any early slot is a plus
  'Pinch Perfect': { slots: [], bench: true },
  'Bunter': { slots: [1, 2, 9] },
  'Stealer': { slots: [1, 2, 9] },
  'Sprinter': { slots: [1, 2, 9] },
};

// Negative hitter traits: show a red warning badge when slotted into the order.
export const NEGATIVE_HITTER_TRAITS = new Set([
  'Whiffer', 'RBI Zero', 'First Pitch Prayer', 'Choker', 'Base Jogger', 'Slow Poke',
]);

// "1-2, 9" style display text for a recommended-slot list.
export const formatSlotRanges = (slots: number[]): string => {
  if (!slots || slots.length === 0) return '';
  const sorted = [...slots].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) { prev = cur; continue; }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  return parts.join(', ');
};

// Trait description at the level actually in effect for the current lineup
// (driven by how many slotted players share the trait's chemistry type).
export const getEffectiveTraitDesc = (
  trait: any,
  chemCounts: Record<ChemistryType, number>,
  language: string
): { level: 1 | 2 | 3; desc: string } => {
  const chem = normalizeChemistry(trait.chemistry);
  const count = chem ? chemCounts[chem] : 0;
  const level = getChemistryLevel(count);
  const desc = language === 'zh-TW'
    ? (trait[`level${level}Zh`] || trait[`level${level}`] || '')
    : (trait[`level${level}`] || '');
  return { level, desc };
};

// --- Position fit -------------------------------------------------------------
export type PositionFit = 'primary' | 'secondary' | 'none';

const IF_POSITIONS = ['1B', '2B', '3B', 'SS'];
const OF_POSITIONS = ['LF', 'CF', 'RF'];
const PITCHER_SLOT = /^(SP|RP|CP)/;

export const canPlayPosition = (player: any, pos: string): PositionFit => {
  if (PITCHER_SLOT.test(pos)) return player.isPitcher ? 'primary' : 'none';
  if (player.isPitcher) return 'none';
  if (pos === 'DH') return 'primary'; // any fielder can DH
  if (player.primaryPosition === pos) return 'primary';
  const secondary: string[] = player.secondaryPositions || [];
  if (secondary.includes(pos)) return 'secondary';
  if (secondary.includes('IF') && IF_POSITIONS.includes(pos)) return 'secondary';
  if (secondary.includes('OF') && OF_POSITIONS.includes(pos)) return 'secondary';
  return 'none';
};

// --- Position-weighted scoring -------------------------------------------------
const MIDDLE_INFIELD = { fielding: 0.3, speed: 0.25, arm: 0.2, contact: 0.15, power: 0.1 };
const ARM_CORNER = { arm: 0.25, power: 0.25, fielding: 0.2, contact: 0.2, speed: 0.1 };
const BAT_CORNER = { power: 0.35, contact: 0.3, fielding: 0.2, arm: 0.1, speed: 0.05 };

export const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  C: { fielding: 0.3, arm: 0.3, contact: 0.2, power: 0.15, speed: 0.05 },
  SS: MIDDLE_INFIELD,
  '2B': MIDDLE_INFIELD,
  CF: { speed: 0.3, fielding: 0.3, arm: 0.15, contact: 0.15, power: 0.1 },
  '3B': ARM_CORNER,
  RF: ARM_CORNER,
  '1B': BAT_CORNER,
  LF: BAT_CORNER,
  DH: { power: 0.5, contact: 0.45, speed: 0.05 },
};

// Weighted score for a fielder at a given position. Stats are 0-100 and the
// weights sum to 1, so the result is already normalized to 0-100.
// Returns null for pitcher/bench slots (no weight table) so the UI can skip it.
export const positionWeightedScore = (player: any, pos: string): number | null => {
  const weights = POSITION_WEIGHTS[pos];
  if (!weights || !player?.stats || player.isPitcher) return null;
  let total = 0;
  for (const [stat, w] of Object.entries(weights)) {
    total += (player.stats[stat] || 0) * w;
  }
  return Math.round(total);
};

// Multiplier the optimizer applies on top of positionWeightedScore:
// secondary positions carry a 10% penalty; the Utility trait refunds 25% of
// that penalty (10% -> 7.5%). Unplayable positions score 0.
export const positionFitMultiplier = (fit: PositionFit, utility: boolean): number => {
  if (fit === 'primary') return 1;
  if (fit === 'secondary') return utility ? 0.925 : 0.9;
  return 0;
};
