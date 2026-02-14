import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Database file path - in data folder
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "ai-crew.db");

// Lazy-initialized — no DB operations at import time (safe for `npm run build`)
let _sqlite: InstanceType<typeof Database> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let _initialized = false;

/**
 * Lazy DB accessor — opens the connection and seeds defaults on first call.
 * This ensures zero side-effects at module import time so `npm run build`
 * never touches the database.
 */
function ensureDb() {
  if (_initialized) return { sqlite: _sqlite!, db: _db! };

  // Create data directory
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Open connection
  _sqlite = new Database(DB_PATH);
  _sqlite.pragma("journal_mode = WAL");
  _db = drizzle(_sqlite, { schema });

  // Create table (idempotent)
  _sqlite.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Seed defaults (INSERT OR IGNORE — atomic, no race condition)
  const now = new Date().toISOString();
  for (const [key, data] of Object.entries(schema.DEFAULT_CONFIG)) {
    _sqlite.prepare(
      "INSERT OR IGNORE INTO config (key, value, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).run(key, data.value, data.description, now, now);
  }

  _initialized = true;
  return { sqlite: _sqlite, db: _db };
}

/**
 * Get a config value by key.
 * Falls back to DEFAULT_CONFIG if the key isn't in the DB.
 */
export function getConfig(key: string): string | null {
  const { db } = ensureDb();
  const result = db.select().from(schema.config).where(eq(schema.config.key, key)).get();
  if (result) return result.value;

  // Fallback to compiled defaults
  const def = schema.DEFAULT_CONFIG[key as keyof typeof schema.DEFAULT_CONFIG];
  return def?.value ?? null;
}

/**
 * Set a config value
 */
export function setConfig(key: string, value: string, description?: string): void {
  const { db } = ensureDb();
  const now = new Date().toISOString();
  const existing = db.select().from(schema.config).where(eq(schema.config.key, key)).get();

  if (existing) {
    db.update(schema.config)
      .set({ value, updatedAt: now })
      .where(eq(schema.config.key, key))
      .run();
  } else {
    db.insert(schema.config)
      .values({ key, value, description: description ?? null, createdAt: now, updatedAt: now })
      .run();
  }
}

/**
 * Get all config entries (DB rows merged with any unseeded defaults)
 */
export function getAllConfig(): schema.Config[] {
  const { db } = ensureDb();
  const rows = db.select().from(schema.config).all();

  // Merge: if a DEFAULT_CONFIG key is missing from DB, include it
  const dbKeys = new Set(rows.map((r) => r.key));
  const now = new Date().toISOString();
  for (const [key, data] of Object.entries(schema.DEFAULT_CONFIG)) {
    if (!dbKeys.has(key)) {
      rows.push({
        key,
        value: data.value,
        description: data.description,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return rows;
}

// Export db path for debugging
export const DATABASE_PATH = DB_PATH;
