import { getDatabase } from '../db/database.js';
import type { ContentInsight } from '../types/content.js';

interface ContentInsightRow {
  topic: string;
  avg_engagement: number;
  best_hook_style: string;
  best_post_time: string;
  last_updated: string;
}

function mapContentInsight(row: ContentInsightRow): ContentInsight {
  return {
    topic: row.topic,
    avgEngagement: Number(row.avg_engagement.toFixed(2)),
    bestHookStyle: row.best_hook_style,
    bestPostTime: row.best_post_time,
    lastUpdated: row.last_updated,
  };
}

export function getContentInsights(): ContentInsight[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT topic, avg_engagement, best_hook_style, best_post_time, last_updated
       FROM content_insights
       ORDER BY avg_engagement DESC, topic ASC`,
    )
    .all() as unknown as ContentInsightRow[];

  return rows.map(mapContentInsight);
}

export function replaceContentInsights(items: ContentInsight[]): void {
  const db = getDatabase();
  const insertStatement = db.prepare(
    `INSERT INTO content_insights (
       topic,
       avg_engagement,
       best_hook_style,
       best_post_time,
       last_updated
     )
     VALUES (?, ?, ?, ?, ?)`
  );

  try {
    db.exec('BEGIN');
    db.prepare('DELETE FROM content_insights').run();

    for (const item of items) {
      insertStatement.run(
        item.topic,
        Number(item.avgEngagement.toFixed(2)),
        item.bestHookStyle,
        item.bestPostTime,
        item.lastUpdated,
      );
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
