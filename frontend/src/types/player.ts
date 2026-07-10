export interface PlayerStats {
  power: number;
  contact: number;
  speed: number;
  fielding: number;
  arm?: number;
  velocity?: number;
  junk?: number;
  accuracy?: number;
}

export interface PitchingInfo {
  pitches: string[];
  armAngle: string | null;
}

export interface Player {
  name: string;
  team: string;
  conference: string;
  division: string;
  rating: string;
  bats: string;
  throws: string;
  age: number;
  salary: string | number;
  chemistry: string;
  traits: string[];
  stats: PlayerStats;
  primaryPosition: string;
  secondaryPositions: string[];
  isPitcher: boolean;
  teamStrength: string;
  pitching?: PitchingInfo;
}
