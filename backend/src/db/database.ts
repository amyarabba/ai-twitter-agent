import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { env } from '../config/env.js';

let database: DatabaseSync | null = null;
let resolvedDatabasePath = '';

interface TableInfoRow {
  name: string;
}

function getTableColumns(db: DatabaseSync, tableName: string): string[] {
  return (db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as unknown as TableInfoRow[]).map((column) => column.name);
}

function getTableSql(db: DatabaseSync, tableName: string): string {
  const row = db
    .prepare(
      `SELECT sql
       FROM sqlite_master
       WHERE type = 'table' AND name = ?
       LIMIT 1`,
    )
    .get(tableName) as { sql?: string } | undefined;

  return row?.sql ?? '';
}

function ensureColumn(
  db: DatabaseSync,
  tableName: string,
  columnName: string,
  definition: string,
): void {
  const columns = getTableColumns(db, tableName);

  if (!columns.includes(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function createReplyDraftsTable(db: DatabaseSync, tableName = 'reply_drafts'): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id TEXT NOT NULL UNIQUE,
      tweet_text TEXT NOT NULL,
      reply_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'rejected', 'posted')),
      reply_post_id TEXT,
      posted_at TEXT
    );
  `);
}

function createContentInsightsTable(
  db: DatabaseSync,
  tableName = 'content_insights',
): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      topic TEXT PRIMARY KEY,
      avg_engagement REAL NOT NULL DEFAULT 0,
      best_hook_style TEXT NOT NULL DEFAULT 'Insight-led',
      best_post_time TEXT NOT NULL DEFAULT 'Morning',
      last_updated TEXT NOT NULL
    );
  `);
}

function ensureReplyDraftSchema(db: DatabaseSync): void {
  createReplyDraftsTable(db);

  const columns = getTableColumns(db, 'reply_drafts');
  const tableSql = getTableSql(db, 'reply_drafts').toLowerCase();
  const hasPostedStatus = tableSql.includes("'posted'");
  const hasReplyPostId = columns.includes('reply_post_id');
  const hasPostedAt = columns.includes('posted_at');

  if (hasPostedStatus && hasReplyPostId && hasPostedAt) {
    return;
  }

  const replyPostIdSelect = hasReplyPostId ? 'reply_post_id' : 'NULL';
  const postedAtSelect = hasPostedAt ? 'posted_at' : 'NULL';

  try {
    db.exec('BEGIN');
    db.exec('DROP TABLE IF EXISTS reply_drafts_migrated');
    createReplyDraftsTable(db, 'reply_drafts_migrated');
    db.exec(`
      INSERT INTO reply_drafts_migrated (
        id,
        tweet_id,
        tweet_text,
        reply_text,
        created_at,
        status,
        reply_post_id,
        posted_at
      )
      SELECT
        id,
        tweet_id,
        tweet_text,
        reply_text,
        created_at,
        CASE
          WHEN status IN ('draft', 'approved', 'rejected', 'posted') THEN status
          ELSE 'draft'
        END,
        ${replyPostIdSelect},
        ${postedAtSelect}
      FROM reply_drafts;

      DROP TABLE reply_drafts;
      ALTER TABLE reply_drafts_migrated RENAME TO reply_drafts;
    `);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
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
      impressions INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      replies INTEGER NOT NULL DEFAULT 0,
      retweets INTEGER NOT NULL DEFAULT 0,
      reposts INTEGER NOT NULL DEFAULT 0,
      engagement_rate REAL NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  createReplyDraftsTable(db);
  createContentInsightsTable(db);
  ensureColumn(db, 'posts', 'x_post_id', 'TEXT');
  ensureColumn(db, 'engagement_logs', 'retweets', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'engagement_logs', 'reposts', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'engagement_logs', 'engagement_rate', 'REAL NOT NULL DEFAULT 0');
  ensureColumn(db, 'content_insights', 'avg_engagement', 'REAL NOT NULL DEFAULT 0');
  ensureColumn(db, 'content_insights', 'best_hook_style', "TEXT NOT NULL DEFAULT 'Insight-led'");
  ensureColumn(db, 'content_insights', 'best_post_time', "TEXT NOT NULL DEFAULT 'Morning'");
  ensureColumn(db, 'content_insights', 'last_updated', 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP');
  ensureReplyDraftSchema(db);
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
