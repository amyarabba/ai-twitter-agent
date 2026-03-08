import { getDatabase } from '../db/database.js';
import type {
  EngagementLog,
  PostContent,
  PostingEvent,
  PostStatus,
  PostType,
  QueuePost,
  SaveDraftInput,
  SchedulePostInput,
} from '../types/content.js';

interface PostRow {
  id: number;
  content: string;
  type: PostType;
  status: PostStatus;
  scheduled_time: string | null;
  created_at: string;
  x_post_id: string | null;
  engagement_id: number | null;
  engagement_impressions: number | null;
  engagement_likes: number | null;
  engagement_replies: number | null;
  engagement_retweets: number | null;
  engagement_timestamp: string | null;
}

function serializeContent(content: PostContent): string {
  return Array.isArray(content) ? JSON.stringify(content) : content;
}

function deserializeContent(type: PostType, content: string): PostContent {
  if (type !== 'thread') {
    return content;
  }

  try {
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    return content
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [content];
}

function countTweetsFromContent(content: PostContent): number {
  return Array.isArray(content) ? content.length : 1;
}

function mapEngagement(row: PostRow): EngagementLog | null {
  if (!row.engagement_id || !row.engagement_timestamp) {
    return null;
  }

  return {
    id: row.engagement_id,
    postId: row.id,
    impressions: row.engagement_impressions ?? 0,
    likes: row.engagement_likes ?? 0,
    replies: row.engagement_replies ?? 0,
    retweets: row.engagement_retweets ?? 0,
    timestamp: row.engagement_timestamp,
  };
}

function mapPost(row: PostRow): QueuePost {
  return {
    id: row.id,
    content: deserializeContent(row.type, row.content),
    type: row.type,
    status: row.status,
    scheduledTime: row.scheduled_time,
    createdAt: row.created_at,
    xPostId: row.x_post_id,
    engagement: mapEngagement(row),
  };
}

function baseSelect(): string {
  return `
    SELECT
      p.id,
      p.content,
      p.type,
      p.status,
      p.scheduled_time,
      p.created_at,
      p.x_post_id,
      (
        SELECT el.id FROM engagement_logs el
        WHERE el.post_id = p.id
        ORDER BY el.timestamp DESC
        LIMIT 1
      ) AS engagement_id,
      (
        SELECT el.impressions FROM engagement_logs el
        WHERE el.post_id = p.id
        ORDER BY el.timestamp DESC
        LIMIT 1
      ) AS engagement_impressions,
      (
        SELECT el.likes FROM engagement_logs el
        WHERE el.post_id = p.id
        ORDER BY el.timestamp DESC
        LIMIT 1
      ) AS engagement_likes,
      (
        SELECT el.replies FROM engagement_logs el
        WHERE el.post_id = p.id
        ORDER BY el.timestamp DESC
        LIMIT 1
      ) AS engagement_replies,
      (
        SELECT el.retweets FROM engagement_logs el
        WHERE el.post_id = p.id
        ORDER BY el.timestamp DESC
        LIMIT 1
      ) AS engagement_retweets,
      (
        SELECT el.timestamp FROM engagement_logs el
        WHERE el.post_id = p.id
        ORDER BY el.timestamp DESC
        LIMIT 1
      ) AS engagement_timestamp
    FROM posts p
  `;
}

function getPostRow(id: number): PostRow | undefined {
  const db = getDatabase();
  return db
    .prepare(`${baseSelect()} WHERE p.id = ?`)
    .get(id) as unknown as PostRow | undefined;
}

export function getPostById(id: number): QueuePost | null {
  const row = getPostRow(id);
  return row ? mapPost(row) : null;
}

function normalizeScheduledTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid scheduled time.');
  }

  return date.toISOString();
}

export function getAllPosts(): QueuePost[] {
  const db = getDatabase();
  const rows = db
    .prepare(`${baseSelect()} ORDER BY p.created_at DESC, p.id DESC`)
    .all() as unknown as PostRow[];

  return rows.map(mapPost);
}

export function saveDraftPost(input: SaveDraftInput): QueuePost {
  const db = getDatabase();
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO posts (content, type, status, scheduled_time, created_at, x_post_id)
       VALUES (?, ?, 'draft', NULL, ?, NULL)`,
    )
    .run(serializeContent(input.content), input.type, createdAt);

  return getPostById(Number(result.lastInsertRowid)) as QueuePost;
}

export function schedulePost(input: SchedulePostInput): QueuePost {
  const db = getDatabase();
  const scheduledTime = normalizeScheduledTime(input.scheduledTime);

  if (input.postId) {
    const existing = getPostById(input.postId);

    if (!existing) {
      throw new Error('Post not found.');
    }

    db.prepare(
      `UPDATE posts
       SET status = 'scheduled', scheduled_time = ?
       WHERE id = ?`,
    ).run(scheduledTime, input.postId);

    return getPostById(input.postId) as QueuePost;
  }

  if (!input.content || !input.type) {
    throw new Error('Content and type are required when scheduling a new post.');
  }

  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO posts (content, type, status, scheduled_time, created_at, x_post_id)
       VALUES (?, ?, 'scheduled', ?, ?, NULL)`,
    )
    .run(serializeContent(input.content), input.type, scheduledTime, createdAt);

  return getPostById(Number(result.lastInsertRowid)) as QueuePost;
}

export function deletePost(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getDueScheduledPosts(referenceTime = new Date().toISOString()): QueuePost[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `${baseSelect()}
       WHERE p.status = 'scheduled'
         AND p.scheduled_time IS NOT NULL
         AND p.scheduled_time <= ?
       ORDER BY p.scheduled_time ASC, p.id ASC`,
    )
    .all(referenceTime) as unknown as PostRow[];

  return rows.map(mapPost);
}

export function getRecentPostingEvents(sinceIso: string): PostingEvent[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT p.content, p.type, el.timestamp
       FROM posts p
       INNER JOIN engagement_logs el ON el.post_id = p.id
       WHERE p.status = 'posted'
         AND el.timestamp >= ?
       ORDER BY el.timestamp ASC`,
    )
    .all(sinceIso) as unknown as Array<{
      content: string;
      type: PostType;
      timestamp: string;
    }>;

  return rows.map((row) => ({
    timestamp: row.timestamp,
    tweetCount: countTweetsFromContent(deserializeContent(row.type, row.content)),
  }));
}

export function delayPostUntil(postId: number, scheduledTime: string): QueuePost {
  const db = getDatabase();
  const normalized = normalizeScheduledTime(scheduledTime);

  db.prepare(
    `UPDATE posts
     SET scheduled_time = ?, status = 'scheduled'
     WHERE id = ?`,
  ).run(normalized, postId);

  return getPostById(postId) as QueuePost;
}

export function markPostAsPosted(postId: number, xPostId: string): QueuePost {
  const db = getDatabase();

  db.prepare(
    `UPDATE posts
     SET status = 'posted', x_post_id = ?
     WHERE id = ?`,
  ).run(xPostId, postId);

  return getPostById(postId) as QueuePost;
}

export function createEngagementLog(postId: number, timestamp: string): void {
  const db = getDatabase();

  db.prepare(
    `INSERT INTO engagement_logs (post_id, impressions, likes, replies, retweets, timestamp)
     VALUES (?, 0, 0, 0, 0, ?)`,
  ).run(postId, timestamp);
}

export function countTweetsForPost(post: QueuePost): number {
  return countTweetsFromContent(post.content);
}
