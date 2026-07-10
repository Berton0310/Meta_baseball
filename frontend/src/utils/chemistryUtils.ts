// Shared helpers for SMB4 team chemistry mechanics.
// Trait effectiveness depends on how many players of the same chemistry
// type are on the roster: 1-2 players = Lv1, 3-6 = Lv2, 7+ = Lv3.

export const CHEMISTRY_TYPES = ['Competitive', 'Spirited', 'Disciplined', 'Scholarly', 'Crafty'] as const;
export type ChemistryType = typeof CHEMISTRY_TYPES[number];

// Representative colors follow the palette already used in TraitsDashboard.tsx.
// The actual values live in index.css as CSS variables so styles stay themeable.
export const CHEMISTRY_COLOR_VARS: Record<ChemistryType, string> = {
  Competitive: 'var(--chem-competitive)',
  Spirited: 'var(--chem-spirited)',
  Disciplined: 'var(--chem-disciplined)',
  Scholarly: 'var(--chem-scholarly)',
  Crafty: 'var(--chem-crafty)',
};

// players.json contains a few misspelled chemistry values (e.g. "Competitve",
// "Spirted"). Normalize them so counts are not split across variants.
export const normalizeChemistry = (chem: string | undefined | null): ChemistryType | null => {
  if (!chem) return null;
  const fixed = chem === 'Competitve' ? 'Competitive' : chem === 'Spirted' ? 'Spirited' : chem;
  return (CHEMISTRY_TYPES as readonly string[]).includes(fixed) ? (fixed as ChemistryType) : null;
};

export const getChemistryLevel = (count: number): 1 | 2 | 3 => {
  if (count >= 7) return 3;
  if (count >= 3) return 2;
  return 1;
};

// Returns the next player-count threshold (3 or 7), or null if already at max level.
export const nextThreshold = (count: number): number | null => {
  if (count >= 7) return null;
  if (count >= 3) return 7;
  return 3;
};
