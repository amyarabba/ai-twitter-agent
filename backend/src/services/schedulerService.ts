import {
  countTweetsForPost,
  createEngagementLog,
  delayPostUntil,
  getDueScheduledPosts,
  getRecentPostingEvents,
  markPostAsPosted,
} from './postRepository.js';
import { isXPublishingReady, postThread, postTweet } from './xService.js';
import type { QueuePost } from '../types/content.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_TWEETS_PER_HOUR = 6;
const RETRY_DELAY_MS = 5 * 60 * 1000;

let schedulerHandle: NodeJS.Timeout | null = null;
let isRunning = false;

function expandPostingEvents(events: Array<{ timestamp: string; tweetCount: number }>): number[] {
  return events
    .flatMap((event) => {
      const timestampMs = new Date(event.timestamp).getTime();
      return Array.from({ length: event.tweetCount }, () => timestampMs);
    })
    .sort((left, right) => left - right);
}

function getNextAvailableTime(
  timestamps: number[],
  tweetCount: number,
  nowMs: number,
): string | null {
  const activeWindow = timestamps.filter((timestamp) => timestamp > nowMs - ONE_HOUR_MS);

  if (tweetCount > MAX_TWEETS_PER_HOUR) {
    throw new Error(`Posts are limited to ${MAX_TWEETS_PER_HOUR} tweets per publish.`);
  }

  if (activeWindow.length + tweetCount <= MAX_TWEETS_PER_HOUR) {
    return null;
  }

  const tweetsToExpire = activeWindow.length + tweetCount - MAX_TWEETS_PER_HOUR;
  const boundaryTimestamp = activeWindow[tweetsToExpire - 1];

  if (boundaryTimestamp === undefined) {
    return new Date(nowMs + ONE_HOUR_MS).toISOString();
  }

  return new Date(boundaryTimestamp + ONE_HOUR_MS + 1000).toISOString();
}

async function publishPost(post: QueuePost): Promise<string> {
  if (post.type === 'thread') {
    if (!Array.isArray(post.content)) {
      throw new Error('Thread posts require an array payload.');
    }

    const result = await postThread(post.content);
    return result.rootTweetId;
  }

  if (Array.isArray(post.content)) {
    throw new Error('Tweet posts require a string payload.');
  }

  const result = await postTweet(post.content);
  return result.rootTweetId;
}

export async function runSchedulerCycle(): Promise<number> {
  if (isRunning) {
    return 0;
  }

  if (!isXPublishingReady()) {
    return 0;
  }

  isRunning = true;

  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const duePosts = getDueScheduledPosts(nowIso);

    if (duePosts.length === 0) {
      return 0;
    }

    const recentEvents = getRecentPostingEvents(
      new Date(now.getTime() - ONE_HOUR_MS).toISOString(),
    );
    const postingTimeline = expandPostingEvents(recentEvents);
    let publishedCount = 0;

    for (const post of duePosts) {
      const tweetCount = countTweetsForPost(post);
      const nextAvailableTime = getNextAvailableTime(
        postingTimeline,
        tweetCount,
        now.getTime(),
      );

      if (nextAvailableTime) {
        delayPostUntil(post.id, nextAvailableTime);
        continue;
      }

      try {
        const xPostId = await publishPost(post);
        const postedAt = new Date().toISOString();

        markPostAsPosted(post.id, xPostId);
        createEngagementLog(post.id, postedAt);

        for (let index = 0; index < tweetCount; index += 1) {
          postingTimeline.push(new Date(postedAt).getTime());
        }
        postingTimeline.sort((left, right) => left - right);
        publishedCount += 1;
      } catch (error) {
        const retryAt = new Date(Date.now() + RETRY_DELAY_MS).toISOString();
        delayPostUntil(post.id, retryAt);
        console.error(`Failed to publish scheduled post ${post.id} to X.`, error);
      }
    }

    if (publishedCount > 0) {
      console.log(`Scheduler published ${publishedCount} queued item(s) to X.`);
    }

    return publishedCount;
  } finally {
    isRunning = false;
  }
}

export function startSchedulerService(): void {
  if (schedulerHandle) {
    return;
  }

  void runSchedulerCycle();
  schedulerHandle = setInterval(() => {
    void runSchedulerCycle();
  }, 60_000);
}
