import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Database file path - in data folder
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "ai-crew.db");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create SQLite connection
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize database tables
export function initializeDatabase() {
  // Create config table if not exists
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Seed default config values if not present (INSERT OR IGNORE is atomic — safe for concurrent build workers)
  const now = new Date().toISOString();
  for (const [key, data] of Object.entries(schema.DEFAULT_CONFIG)) {
    sqlite.prepare(
      "INSERT OR IGNORE INTO config (key, value, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).run(key, data.value, data.description, now, now);
  }
}

// Initialize on module load
initializeDatabase();

/**
 * Get a config value by key
 */
export function getConfig(key: string): string | null {
  const result = db.select().from(schema.config).where(eq(schema.config.key, key)).get();
  return result?.value ?? null;
}

/**
 * Set a config value
 */
export function setConfig(key: string, value: string, description?: string): void {
  const now = new Date().toISOString();
  const existing = getConfig(key);
  
  if (existing !== null) {
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
 * Get all config entries
 */
export function getAllConfig(): schema.Config[] {
  return db.select().from(schema.config).all();
}

// Export db path for debugging
export const DATABASE_PATH = DB_PATH;
