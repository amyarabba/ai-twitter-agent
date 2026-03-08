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
  reply_post_id: string | null;
  posted_at: string | null;
}

function mapReplyDraft(row: ReplyDraftRow): ReplyDraft {
  return {
    id: row.id,
    tweetId: row.tweet_id,
    tweetText: row.tweet_text,
    replyText: row.reply_text,
    createdAt: row.created_at,
    status: row.status,
    replyPostId: row.reply_post_id,
    postedAt: row.posted_at,
  };
}

function baseSelect(): string {
  return `
    SELECT
      id,
      tweet_id,
      tweet_text,
      reply_text,
      created_at,
      status,
      reply_post_id,
      posted_at
    FROM reply_drafts
  `;
}

function getReplyDraftById(id: number): ReplyDraft | null {
  const db = getDatabase();
  const row = db
    .prepare(`${baseSelect()} WHERE id = ? LIMIT 1`)
    .get(id) as unknown as ReplyDraftRow | undefined;

  return row ? mapReplyDraft(row) : null;
}

export function getReplyDrafts(): ReplyDraft[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `${baseSelect()}
       ORDER BY
         CASE status
           WHEN 'draft' THEN 0
           WHEN 'approved' THEN 1
           WHEN 'posted' THEN 2
           ELSE 3
         END,
         COALESCE(posted_at, created_at) DESC,
         id DESC`,
    )
    .all() as unknown as ReplyDraftRow[];

  return rows.map(mapReplyDraft);
}

export function getApprovedReplyDrafts(): ReplyDraft[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `${baseSelect()}
       WHERE status = 'approved'
       ORDER BY created_at ASC, id ASC`,
    )
    .all() as unknown as ReplyDraftRow[];

  return rows.map(mapReplyDraft);
}

export function getReplyDraftByTweetId(tweetId: string): ReplyDraft | null {
  const db = getDatabase();
  const row = db
    .prepare(
      `${baseSelect()}
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

  return getReplyDraftById(Number(result.lastInsertRowid)) as ReplyDraft;
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

  return getReplyDraftById(input.id);
}

export function markReplyDraftAsPosted(
  id: number,
  replyPostId: string,
  postedAt: string,
): ReplyDraft | null {
  const db = getDatabase();
  const result = db
    .prepare(
      `UPDATE reply_drafts
       SET status = 'posted', reply_post_id = ?, posted_at = ?
       WHERE id = ?`,
    )
    .run(replyPostId, postedAt, id);

  if (result.changes === 0) {
    return null;
  }

  return getReplyDraftById(id);
}
