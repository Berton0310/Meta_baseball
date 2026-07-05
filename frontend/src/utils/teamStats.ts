export interface TeamStat {
  team: string;
  conference: string;
  division: string;
  teamStrength: string;
  totalSalary: number;
  avgSalary: number;
  avgAge: number;
  topPlayers: any[];
  chemistryCounts: Record<string, number>;
  avgStats: {
    power: number;
    contact: number;
    speed: number;
    fielding: number;
    arm: number;
    velocity: number;
    junk: number;
    accuracy: number;
  };
}

export const calculateTeamStats = (players: any[]): TeamStat[] => {
  const teamGroups: Record<string, any[]> = {};
  
  players.forEach(p => {
    if (!teamGroups[p.team]) teamGroups[p.team] = [];
    teamGroups[p.team].push(p);
  });

  const ratingWeights: Record<string, number> = {
    'S': 100, 'A+': 95, 'A': 90, 'A-': 85,
    'B+': 80, 'B': 75, 'B-': 70,
    'C+': 65, 'C': 60, 'C-': 55,
    'D+': 50, 'D': 45, 'D-': 40
  };

  const parseSal = (s: string | number) => {
    if (!s) return 0;
    if (typeof s === 'number') {
      return s > 1000 ? s / 1000000 : s; // If it's a large number like 5000000, return 5.0. If it's already 5.0, return 5.0
    }
    const clean = String(s).replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  };

  const results: TeamStat[] = [];

  for (const [teamName, roster] of Object.entries(teamGroups)) {
    let totalAge = 0;
    let totalSal = 0;
    let validAgeCount = 0;

    const chemCounts: Record<string, number> = {};
    const sumStats = {
      power: 0, contact: 0, speed: 0, fielding: 0, arm: 0,
      velocity: 0, junk: 0, accuracy: 0
    };
    let countFielders = 0;
    let countPitchers = 0;

    roster.forEach(p => {
      // Age and Salary
      if (p.age) {
        totalAge += parseInt(p.age);
        validAgeCount++;
      }
      totalSal += parseSal(p.salary);

      // Chemistry
      if (p.chemistry && p.chemistry !== '-') {
        chemCounts[p.chemistry] = (chemCounts[p.chemistry] || 0) + 1;
      }

      // Stats
      if (p.isPitcher) {
        sumStats.velocity += p.stats.velocity || 0;
        sumStats.junk += p.stats.junk || 0;
        sumStats.accuracy += p.stats.accuracy || 0;
        countPitchers++;
      } else {
        sumStats.power += p.stats.power || 0;
        sumStats.contact += p.stats.contact || 0;
        sumStats.speed += p.stats.speed || 0;
        sumStats.fielding += p.stats.fielding || 0;
        sumStats.arm += p.stats.arm || 0;
        countFielders++;
      }
    });

    // Top players
    const sortedRoster = [...roster].sort((a, b) => {
      const wA = ratingWeights[a.rating] || 0;
      const wB = ratingWeights[b.rating] || 0;
      return wB - wA;
    });
    const topPlayers = sortedRoster.slice(0, 3);

    const firstPlayer = roster[0] || {};
    
    // Formatting Salary to Millions nicely
    const avgSal = totalSal / roster.length;

    results.push({
      team: teamName,
      conference: firstPlayer.conference || '',
      division: firstPlayer.division || '',
      teamStrength: firstPlayer.teamStrength || '',
      totalSalary: Number(totalSal.toFixed(1)),
      avgSalary: Number(avgSal.toFixed(1)),
      avgAge: validAgeCount ? Number((totalAge / validAgeCount).toFixed(1)) : 0,
      topPlayers,
      chemistryCounts: chemCounts,
      avgStats: {
        power: countFielders ? Math.round(sumStats.power / countFielders) : 0,
        contact: countFielders ? Math.round(sumStats.contact / countFielders) : 0,
        speed: countFielders ? Math.round(sumStats.speed / countFielders) : 0,
        fielding: countFielders ? Math.round(sumStats.fielding / countFielders) : 0,
        arm: countFielders ? Math.round(sumStats.arm / countFielders) : 0,
        velocity: countPitchers ? Math.round(sumStats.velocity / countPitchers) : 0,
        junk: countPitchers ? Math.round(sumStats.junk / countPitchers) : 0,
        accuracy: countPitchers ? Math.round(sumStats.accuracy / countPitchers) : 0,
      }
    });
  }

  return results;
};
