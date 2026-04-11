import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.js";
import config from "../config.js";
import { mkdir } from "fs/promises";
import path from "path";

// Ensure database directories exist
async function ensureDirectories() {
  const dbDir = path.dirname(config.dbPath);
  const backupDir = config.dbBackupPath;
  
  try {
    await mkdir(dbDir, { recursive: true });
    await mkdir(backupDir, { recursive: true });
    console.log(`[DB] Database directories created: ${dbDir}, ${backupDir}`);
  } catch (error) {
    console.error('[ERROR] Failed to create database directories:', error);
  }
}

// Create directories first
await ensureDirectories();

// Create SQLite database with persistent path
const sqlite = new Database(config.dbPath, { create: true });

sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS battles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    duration_minutes INTEGER,
    activated_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    headline TEXT NOT NULL,
    avatar_url TEXT,
    color TEXT NOT NULL DEFAULT '#1a56a8',
    position INTEGER NOT NULL DEFAULT 0
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    voter_name TEXT NOT NULL DEFAULT '',
    voter_document TEXT,
    voter_phone TEXT,
    fingerprint TEXT NOT NULL,
    voted_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique
    ON votes(battle_id, fingerprint);
`);

// Migrate: add tie-related columns if they don't exist yet
const tieColumns = [
  "ALTER TABLE battles ADD COLUMN tied_participant_ids TEXT",
  "ALTER TABLE battles ADD COLUMN tiebreak_round INTEGER DEFAULT 0",
  "ALTER TABLE battles ADD COLUMN winner_id INTEGER",
];
for (const sql of tieColumns) {
  try { sqlite.exec(sql); } catch { /* column already exists */ }
}

export const db = drizzle(sqlite, { schema });
export { schema };
