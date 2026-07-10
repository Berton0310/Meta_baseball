// One-off script: add a stable, deterministic `id` field to every player in players.json.
// ID format: {team-slug}-{name-slug}. Collisions get a -2 / -3 ... suffix (warned on output).
// Usage: node scripts/addPlayerIds.mjs   (run from frontend/)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYERS_PATH = path.resolve(__dirname, '../src/data/players.json');

/** Lowercase, non-alphanumeric runs -> single hyphen, trim leading/trailing hyphens. */
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const raw = readFileSync(PLAYERS_PATH, 'utf8');
const players = JSON.parse(raw);
if (!Array.isArray(players)) {
  console.error('players.json is not an array, aborting.');
  process.exit(1);
}

const seen = new Map(); // baseId -> count
const collisions = [];

const withIds = players.map((player) => {
  const baseId = `${slugify(player.team)}-${slugify(player.name)}`;
  const count = (seen.get(baseId) ?? 0) + 1;
  seen.set(baseId, count);
  const id = count === 1 ? baseId : `${baseId}-${count}`;
  if (count > 1) collisions.push(id);
  // Put id first; keep all original fields in their original order.
  const { id: _drop, ...rest } = player;
  return { id, ...rest };
});

// Validate: serialize, re-parse, and check id uniqueness before overwriting.
const output = JSON.stringify(withIds, null, 2) + '\n';
const reparsed = JSON.parse(output);
const ids = new Set(reparsed.map((p) => p.id));
if (ids.size !== reparsed.length) {
  console.error('FATAL: duplicate ids remain after suffixing, aborting without writing.');
  process.exit(1);
}
if (reparsed.length !== players.length) {
  console.error('FATAL: player count changed, aborting without writing.');
  process.exit(1);
}

writeFileSync(PLAYERS_PATH, output, 'utf8');

console.log(`Done. ${reparsed.length} players written with ids.`);
if (collisions.length > 0) {
  console.warn(`WARNING: ${collisions.length} collision(s) resolved with numeric suffix:`);
  for (const id of collisions) console.warn(`  - ${id}`);
} else {
  console.log('No collisions.');
}
