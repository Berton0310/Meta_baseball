export type OptimizationStrategy = 'overall' | 'power' | 'contact' | 'speed' | 'defense' | 'team_signature';

export const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP'];

export interface Lineup {
  [position: string]: any | null; // Returns player object or null
}

const getScore = (player: any, strategy: OptimizationStrategy): number => {
  const { power, contact, speed, fielding, arm, velocity, junk, accuracy } = player.stats;
  if (player.isPitcher) {
    if (strategy === 'power' || strategy === 'contact' || strategy === 'speed') return 0;
    if (strategy === 'defense') return fielding + (arm || 0);
    return velocity + junk + accuracy;
  }

  switch (strategy) {
    case 'power': return power;
    case 'contact': return contact;
    case 'speed': return speed;
    case 'defense': return fielding + (arm || 0);
    case 'overall':
    default:
      return power + contact + speed + fielding + (arm || 0);
  }
};

export const autoPickLineup = (players: any[], teamName: string, strategy: OptimizationStrategy): Lineup => {
  const teamPlayers = players.filter(p => p.team === teamName);
  
  let appliedStrategy = strategy;
  if (strategy === 'team_signature' && teamPlayers.length > 0) {
    const strength = teamPlayers[0].teamStrength || '';
    if (strength.includes('Power')) appliedStrategy = 'power';
    else if (strength.includes('Contact')) appliedStrategy = 'contact';
    else if (strength.includes('Speed')) appliedStrategy = 'speed';
    else if (strength.includes('Defensive')) appliedStrategy = 'defense';
    else appliedStrategy = 'overall';
  }
  
  // Sort players by score
  const sortedPlayers = [...teamPlayers].sort((a, b) => getScore(b, appliedStrategy as OptimizationStrategy) - getScore(a, appliedStrategy as OptimizationStrategy));
  
  const lineup: Lineup = {
    C: null, '1B': null, '2B': null, '3B': null, SS: null, 
    LF: null, CF: null, RF: null, DH: null, SP: null
  };

  const usedPlayerNames = new Set<string>();

  // Helper to assign a player
  const tryAssign = (player: any) => {
    if (usedPlayerNames.has(player.name)) return false;

    if (player.isPitcher) {
      if (!lineup.SP && (player.primaryPosition === 'SP' || player.primaryPosition.includes('SP'))) {
        lineup.SP = player;
        usedPlayerNames.add(player.name);
        return true;
      }
      return false;
    }

    // Try primary
    if (!lineup[player.primaryPosition] && lineup[player.primaryPosition] !== undefined) {
      lineup[player.primaryPosition] = player;
      usedPlayerNames.add(player.name);
      return true;
    }

    // Try secondary
    for (const pos of player.secondaryPositions) {
      if (!lineup[pos] && lineup[pos] !== undefined) {
        lineup[pos] = player;
        usedPlayerNames.add(player.name);
        return true;
      }
    }

    // Try DH
    if (!lineup.DH) {
      lineup.DH = player;
      usedPlayerNames.add(player.name);
      return true;
    }

    return false;
  };

  // First pass: Try to slot highest scorers
  for (const p of sortedPlayers) {
    tryAssign(p);
  }

  // Second pass: fill empty spots with whoever is left (just to ensure a complete team if possible)
  for (const pos of POSITIONS) {
    if (!lineup[pos]) {
      const available = sortedPlayers.find(p => !usedPlayerNames.has(p.name) && (pos === 'SP' ? p.isPitcher : !p.isPitcher));
      if (available) {
        lineup[pos] = available;
        usedPlayerNames.add(available.name);
      }
    }
  }

  return lineup;
};

export type BattingStrategy = 'traditional' | 'sabermetrics';

// Auto-arranges the batting order based on baseball logic
export const optimizeBattingOrder = (roster: any[], strategy: BattingStrategy = 'traditional'): string[] => {
  if (!roster || roster.length === 0) return [];
  
  let unassigned = [...roster];
  const order: any[] = new Array(Math.max(9, roster.length)).fill(null);

  const extractBest = (scorer: (p: any) => number) => {
    unassigned.sort((a, b) => scorer(b) - scorer(a));
    const best = unassigned[0];
    unassigned = unassigned.slice(1);
    return best;
  };

  // If we don't have exactly 9 players, just sort by overall hitting
  if (unassigned.length !== 9) {
    return unassigned.sort((a, b) => (b.stats.power + b.stats.contact) - (a.stats.power + a.stats.contact)).map(p => p.name);
  }

  if (strategy === 'traditional') {
    // 3rd: Best overall hitter
    order[2] = extractBest(p => p.stats.power * 1.2 + p.stats.contact);
    // 4th: Best power
    order[3] = extractBest(p => p.stats.power * 2 + p.stats.contact);
    // 5th: Next best power
    order[4] = extractBest(p => p.stats.power * 1.5 + p.stats.contact);
    // 1st: Best speed + contact
    order[0] = extractBest(p => p.stats.speed * 1.5 + p.stats.contact * 1.2);
    // 2nd: Best contact
    order[1] = extractBest(p => p.stats.contact * 1.5 + p.stats.speed);
    // 8th: Worst overall hitter
    order[7] = extractBest(p => -(p.stats.power + p.stats.contact + p.stats.speed));
    // 9th: "Second leadoff" - best speed of remaining
    order[8] = extractBest(p => p.stats.speed);
    // 6th & 7th: Best remaining hitters
    order[5] = extractBest(p => p.stats.power + p.stats.contact);
    order[6] = unassigned[0]; // Last remaining player
  } else if (strategy === 'sabermetrics') {
    // 2nd: Best overall hitter (wRC+ equivalent)
    order[1] = extractBest(p => p.stats.power + p.stats.contact * 1.2);
    // 4th: Best power remaining (SLG equivalent)
    order[3] = extractBest(p => p.stats.power * 1.5 + p.stats.contact);
    // 1st: Highest OBP remaining (Contact focus)
    order[0] = extractBest(p => p.stats.contact * 1.5 + p.stats.power * 0.5);
    // 5th: Next best overall hitter
    order[4] = extractBest(p => p.stats.power + p.stats.contact);
    
    // We need the 5th best hitter for the 3rd spot.
    // Since 1st, 2nd, 4th, 5th are taken (top 4 hitters), the next best is roughly the 5th best overall.
    unassigned.sort((a, b) => (b.stats.power + b.stats.contact) - (a.stats.power + a.stats.contact));
    order[2] = unassigned.shift();
    
    // Remaining 4 players for 6th, 7th, 8th, 9th
    // Sort them worst to best
    unassigned.sort((a, b) => (a.stats.power + a.stats.contact) - (b.stats.power + b.stats.contact));
    order[8] = unassigned.shift(); // 9th gets the worst
    order[7] = unassigned.shift(); // 8th gets the 2nd worst
    order[6] = unassigned.shift(); // 7th gets the 3rd worst
    order[5] = unassigned.shift(); // 6th gets the best of the bottom 4
  }

  return order.map(p => p.name);
};
