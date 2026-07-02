import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataDir = process.env.FLEETDECK_DATA_DIR || join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, 'fleetdeck.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

export const id = () => nanoid(12);

seedGlobalCommands();

/** Seed reusable global command templates once. */
function seedGlobalCommands(): void {
  const count = db
    .prepare('SELECT COUNT(*) AS n FROM commands WHERE project_id IS NULL')
    .get() as { n: number };
  if (count.n > 0) return;

  const insert = db.prepare(
    `INSERT INTO commands (id, project_id, label, command, kind, icon, sort_order)
     VALUES (@id, NULL, @label, @command, @kind, @icon, @sort_order)`
  );
  const defaults = [
    { label: 'Open Claude', command: 'claude', kind: 'claude', icon: 'sparkles', sort_order: 0 },
    { label: 'Start dev server', command: 'npm run dev', kind: 'dev', icon: 'play', sort_order: 1 },
    { label: 'Run tests', command: 'npm test', kind: 'test', icon: 'flask', sort_order: 2 },
    { label: 'Git status', command: 'git status', kind: 'git', icon: 'git', sort_order: 3 },
    { label: 'Install deps', command: 'npm install', kind: 'custom', icon: 'package', sort_order: 4 },
  ];
  const tx = db.transaction(() => {
    for (const d of defaults) insert.run({ id: id(), ...d });
  });
  tx();
}
