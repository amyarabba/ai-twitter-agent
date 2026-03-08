import {
  getApprovedReplyDrafts,
  markReplyDraftAsPosted,
} from './replyDraftRepository.js';
import { isXPublishingReady, postReply } from './xService.js';

const REPLY_PUBLISH_INTERVAL_MS = 10 * 60 * 1000;
const LIVE_TWEET_ID_PATTERN = /^\d+$/;

let replyPublisherHandle: NodeJS.Timeout | null = null;
let isRunning = false;

function isPublishableTweetId(tweetId: string): boolean {
  return LIVE_TWEET_ID_PATTERN.test(tweetId.trim());
}

export async function runReplyPublisherCycle(): Promise<number> {
  if (isRunning) {
    return 0;
  }

  if (!isXPublishingReady()) {
    return 0;
  }

  isRunning = true;

  try {
    const approvedDrafts = getApprovedReplyDrafts();

    if (approvedDrafts.length === 0) {
      return 0;
    }

    let publishedCount = 0;

    for (const draft of approvedDrafts) {
      if (!isPublishableTweetId(draft.tweetId)) {
        console.warn(
          `[ReplyPublisher] Skipping reply draft ${draft.id} because target ${draft.tweetId} is not a live X tweet id.`,
        );
        continue;
      }

      console.log(
        `[ReplyPublisher] Attempting to publish approved reply draft ${draft.id} for target ${draft.tweetId}.`,
      );

      try {
        const replyPostId = await postReply(draft.replyText, draft.tweetId);
        const postedAt = new Date().toISOString();

        markReplyDraftAsPosted(draft.id, replyPostId, postedAt);
        publishedCount += 1;

        console.log(
          `[ReplyPublisher] Reply draft ${draft.id} posted successfully as ${replyPostId}.`,
        );
      } catch (error) {
        console.error(
          `[ReplyPublisher] Failed to post reply draft ${draft.id} to X.`,
          error,
        );
      }
    }

    if (publishedCount > 0) {
      console.log(`[ReplyPublisher] Published ${publishedCount} approved repl${publishedCount === 1 ? 'y' : 'ies'}.`);
    }

    return publishedCount;
  } finally {
    isRunning = false;
  }
}

export function startReplyPublisher(): void {
  if (replyPublisherHandle) {
    return;
  }

  void runReplyPublisherCycle();
  replyPublisherHandle = setInterval(() => {
    void runReplyPublisherCycle();
  }, REPLY_PUBLISH_INTERVAL_MS);
}
