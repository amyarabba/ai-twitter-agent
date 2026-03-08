import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { env } from '../config/env.js';

let database: DatabaseSync | null = null;
let resolvedDatabasePath = '';

function ensureColumn(db: DatabaseSync, tableName: string, columnName: string, definition: string): void {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function createSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('tweet', 'thread')),
      status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'posted')),
      scheduled_time TEXT,
      created_at TEXT NOT NULL,
      x_post_id TEXT
    );

    CREATE TABLE IF NOT EXISTS engagement_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      impressions INTEGER NOT NULL,
      likes INTEGER NOT NULL,
      replies INTEGER NOT NULL,
      retweets INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  ensureColumn(db, 'posts', 'x_post_id', 'TEXT');
}

export function initializeDatabase(): DatabaseSync {
  if (database) {
    return database;
  }

  resolvedDatabasePath = path.resolve(process.cwd(), env.DATABASE_PATH);
  fs.mkdirSync(path.dirname(resolvedDatabasePath), { recursive: true });

  database = new DatabaseSync(resolvedDatabasePath);
  createSchema(database);

  return database;
}

export function getDatabase(): DatabaseSync {
  return initializeDatabase();
}

export function getDatabasePath(): string {
  if (!resolvedDatabasePath) {
    initializeDatabase();
  }

  return resolvedDatabasePath;
}
