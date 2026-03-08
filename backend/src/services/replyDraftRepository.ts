import { getDatabase } from '../db/database.js';
import type {
  ReplyDraft,
  ReplyDraftStatus,
  SaveReplyDraftInput,
  UpdateReplyDraftStatusInput,
} from '../types/content.js';

interface ReplyDraftRow {
  id: number;
  tweet_id: string;
  tweet_text: string;
  reply_text: string;
  created_at: string;
  status: ReplyDraftStatus;
}

function mapReplyDraft(row: ReplyDraftRow): ReplyDraft {
  return {
    id: row.id,
    tweetId: row.tweet_id,
    tweetText: row.tweet_text,
    replyText: row.reply_text,
    createdAt: row.created_at,
    status: row.status,
  };
}

export function getReplyDrafts(): ReplyDraft[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, tweet_id, tweet_text, reply_text, created_at, status
       FROM reply_drafts
       ORDER BY
         CASE status
           WHEN 'draft' THEN 0
           WHEN 'approved' THEN 1
           ELSE 2
         END,
         created_at DESC,
         id DESC`,
    )
    .all() as unknown as ReplyDraftRow[];

  return rows.map(mapReplyDraft);
}

export function getReplyDraftByTweetId(tweetId: string): ReplyDraft | null {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT id, tweet_id, tweet_text, reply_text, created_at, status
       FROM reply_drafts
       WHERE tweet_id = ?
       LIMIT 1`,
    )
    .get(tweetId) as unknown as ReplyDraftRow | undefined;

  return row ? mapReplyDraft(row) : null;
}

export function saveReplyDraft(input: SaveReplyDraftInput): ReplyDraft {
  const existing = getReplyDraftByTweetId(input.tweetId);

  if (existing) {
    return existing;
  }

  const db = getDatabase();
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO reply_drafts (tweet_id, tweet_text, reply_text, created_at, status)
       VALUES (?, ?, ?, ?, 'draft')`,
    )
    .run(input.tweetId, input.tweetText, input.replyText, createdAt);

  const row = db
    .prepare(
      `SELECT id, tweet_id, tweet_text, reply_text, created_at, status
       FROM reply_drafts
       WHERE id = ?`,
    )
    .get(Number(result.lastInsertRowid)) as unknown as ReplyDraftRow;

  return mapReplyDraft(row);
}

export function updateReplyDraftStatus(
  input: UpdateReplyDraftStatusInput,
): ReplyDraft | null {
  const db = getDatabase();
  const result = db
    .prepare(
      `UPDATE reply_drafts
       SET status = ?
       WHERE id = ?`,
    )
    .run(input.status, input.id);

  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT id, tweet_id, tweet_text, reply_text, created_at, status
       FROM reply_drafts
       WHERE id = ?`,
    )
    .get(input.id) as unknown as ReplyDraftRow;

  return mapReplyDraft(row);
}
