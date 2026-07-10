// My Team storage layer (phase 1 — data only, no React).
// Persists user-created rosters to localStorage under the `smb4.` prefix.

import playersData from '../data/players.json';

// ---------------------------------------------------------------------------
// Player type (canonical shape of entries in players.json)
// ---------------------------------------------------------------------------

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

export interface Player {
  id: string;
  name: string;
  team: string;
  conference: string;
  division: string;
  rating: string;
  bats: string;
  throws: string;
  age: number;
  salary: string;
  chemistry: string;
  traits: string[];
  stats: PlayerStats;
  primaryPosition: string;
  secondaryPositions: string[];
  isPitcher: boolean;
  teamStrength: string;
  pitching?: {
    pitches: string[];
    armAngle: string;
  };
}

const ALL_PLAYERS = playersData as unknown as Player[];

// Lazy module-level index: player id -> Player (O(1) lookups for myteam rosters).
let playerIndex: Map<string, Player> | null = null;
function getPlayerIndex(): Map<string, Player> {
  if (!playerIndex) {
    playerIndex = new Map(ALL_PLAYERS.map((p) => [p.id, p]));
  }
  return playerIndex;
}

// ---------------------------------------------------------------------------
// Roster model & storage keys
// ---------------------------------------------------------------------------

export interface MyTeamRoster {
  id: string;          // crypto.randomUUID()
  name: string;        // user-provided name
  playerIds: string[]; // ids referencing players.json
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
}

const ROSTERS_KEY = 'smb4.myTeams';
const ACTIVE_KEY = 'smb4.activeMyTeam';
const EXPORT_VERSION = 1;

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts.
  return `roster-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Read all rosters; corrupted/missing storage yields an empty list, never throws. */
function readRosters(): MyTeamRoster[] {
  try {
    const raw = localStorage.getItem(ROSTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is MyTeamRoster =>
        r !== null &&
        typeof r === 'object' &&
        typeof r.id === 'string' &&
        typeof r.name === 'string' &&
        Array.isArray(r.playerIds)
    );
  } catch {
    return [];
  }
}

function writeRosters(rosters: MyTeamRoster[]): void {
  try {
    localStorage.setItem(ROSTERS_KEY, JSON.stringify(rosters));
  } catch {
    // Quota exceeded / storage unavailable: silently ignore (data layer must not throw).
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function listRosters(): MyTeamRoster[] {
  return readRosters();
}

export function getRoster(id: string): MyTeamRoster | undefined {
  return readRosters().find((r) => r.id === id);
}

export function createRoster(name: string, playerIds: string[] = []): MyTeamRoster {
  const now = nowIso();
  const roster: MyTeamRoster = {
    id: newId(),
    name,
    playerIds: [...playerIds],
    createdAt: now,
    updatedAt: now,
  };
  writeRosters([...readRosters(), roster]);
  return roster;
}

export function updateRoster(
  id: string,
  patch: Partial<Pick<MyTeamRoster, 'name' | 'playerIds'>>
): MyTeamRoster | undefined {
  const rosters = readRosters();
  const index = rosters.findIndex((r) => r.id === id);
  if (index === -1) return undefined;
  const updated: MyTeamRoster = {
    ...rosters[index],
    ...patch,
    id: rosters[index].id, // id is immutable
    updatedAt: nowIso(),
  };
  rosters[index] = updated;
  writeRosters(rosters);
  return updated;
}

export function deleteRoster(id: string): boolean {
  const rosters = readRosters();
  const next = rosters.filter((r) => r.id !== id);
  if (next.length === rosters.length) return false;
  writeRosters(next);
  if (getActiveRosterId() === id) setActiveRosterId(null);
  return true;
}

export function duplicateRoster(id: string, newName: string): MyTeamRoster | undefined {
  const source = getRoster(id);
  if (!source) return undefined;
  return createRoster(newName, source.playerIds);
}

// ---------------------------------------------------------------------------
// Active roster selection
// ---------------------------------------------------------------------------

export function getActiveRosterId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveRosterId(id: string | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(ACTIVE_KEY);
    } else {
      localStorage.setItem(ACTIVE_KEY, id);
    }
  } catch {
    // Storage unavailable: ignore.
  }
}

// ---------------------------------------------------------------------------
// Create from a static team
// ---------------------------------------------------------------------------

/** Create a roster containing every player of the given static team. */
export function createFromTeam(teamName: string, rosterName: string): MyTeamRoster {
  const playerIds = ALL_PLAYERS.filter((p) => p.team === teamName).map((p) => p.id);
  return createRoster(rosterName, playerIds);
}

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

interface RosterExport {
  version: number;
  name: string;
  playerIds: string[];
  exportedAt: string;
}

/** Serialize a roster for sharing. Returns null if the roster does not exist. */
export function exportRoster(id: string): string | null {
  const roster = getRoster(id);
  if (!roster) return null;
  const payload: RosterExport = {
    version: EXPORT_VERSION,
    name: roster.name,
    playerIds: roster.playerIds,
    exportedAt: nowIso(),
  };
  return JSON.stringify(payload, null, 2);
}

export type ImportResult =
  | { ok: true; roster: MyTeamRoster }
  | { ok: false; error: string };

/**
 * Validate and import a roster export. On success the roster is saved with a
 * freshly generated id (never overwrites an existing roster).
 */
export function importRoster(json: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Invalid JSON.' };
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'Expected a JSON object.' };
  }
  const obj = data as Record<string, unknown>;

  if (obj.version !== EXPORT_VERSION) {
    return { ok: false, error: `Unsupported version: ${String(obj.version)} (expected ${EXPORT_VERSION}).` };
  }
  if (typeof obj.name !== 'string' || obj.name.trim() === '') {
    return { ok: false, error: 'Field "name" must be a non-empty string.' };
  }
  if (!Array.isArray(obj.playerIds)) {
    return { ok: false, error: 'Field "playerIds" must be an array.' };
  }

  const index = getPlayerIndex();
  const invalid: string[] = [];
  const playerIds: string[] = [];
  for (const pid of obj.playerIds) {
    if (typeof pid !== 'string' || !index.has(pid)) {
      invalid.push(String(pid));
    } else {
      playerIds.push(pid);
    }
  }
  if (invalid.length > 0) {
    return { ok: false, error: `Unknown player id(s): ${invalid.join(', ')}` };
  }

  return { ok: true, roster: createRoster(obj.name, playerIds) };
}

// ---------------------------------------------------------------------------
// Team source abstraction (used by phase 2 UI)
// ---------------------------------------------------------------------------

export type TeamSource =
  | { kind: 'static'; team: string }
  | { kind: 'myteam'; rosterId: string };

/** Resolve the players for a team source. Unknown ids / rosters are skipped. */
export function getRosterPlayers(source: TeamSource): Player[] {
  if (source.kind === 'static') {
    return ALL_PLAYERS.filter((p) => p.team === source.team);
  }
  const roster = getRoster(source.rosterId);
  if (!roster) return [];
  const index = getPlayerIndex();
  return roster.playerIds
    .map((id) => index.get(id))
    .filter((p): p is Player => p !== undefined);
}

/** Display label for a team source (team name, or the user-given roster name). */
export function sourceLabel(source: TeamSource): string {
  if (source.kind === 'static') return source.team;
  return getRoster(source.rosterId)?.name ?? '';
}

// ---------------------------------------------------------------------------
// TeamSource <-> string encoding (used as <select> values and storage keys)
// ---------------------------------------------------------------------------

/** Encode a team source as `static:{team}` / `myteam:{rosterId}`. */
export function encodeTeamSource(source: TeamSource): string {
  return source.kind === 'static'
    ? `static:${source.team}`
    : `myteam:${source.rosterId}`;
}

/** Decode an encoded team source; unprefixed values fall back to a static team. */
export function decodeTeamSource(value: string): TeamSource {
  if (value.startsWith('myteam:')) {
    return { kind: 'myteam', rosterId: value.slice('myteam:'.length) };
  }
  if (value.startsWith('static:')) {
    return { kind: 'static', team: value.slice('static:'.length) };
  }
  return { kind: 'static', team: value };
}
