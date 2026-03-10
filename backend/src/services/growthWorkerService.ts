import {
  getReplyDraftByTweetId,
  saveReplyDraft,
} from './replyDraftRepository.js';
import {
  generateGrowthReply,
  getGrowthTargets,
} from './replyHunterService.js';

import { postReply } from './xService.js';

const REPLY_HUNTER_INTERVAL_MS = 20 * 60 * 1000;
const MAX_DRAFTS_PER_CYCLE = 3;

let growthWorkerHandle: NodeJS.Timeout | null = null;
let isRunning = false;

export async function runReplyHunterCycle(): Promise<number> {
  if (isRunning) {
    return 0;
  }

  isRunning = true;

  try {
    const targets = (await getGrowthTargets()).items;
    let createdCount = 0;

    for (const target of targets) {
      if (createdCount >= MAX_DRAFTS_PER_CYCLE) {
        break;
      }

      if (getReplyDraftByTweetId(target.tweetId)) {
        continue;
      }

      const reply = await generateGrowthReply({
  tweetText: target.text,
  author: target.author,
});

saveReplyDraft({
  tweetId: target.tweetId,
  tweetText: target.text,
  replyText: reply.replyText,
});

/* random human delay */
await new Promise(resolve =>
  setTimeout(resolve, Math.random() * 900000 + 300000)
);

/* post reply automatically */
await postReply(reply.replyText, target.tweetId);

      createdCount += 1;
    }

    if (createdCount > 0) {
      console.log(`Reply Hunter generated and posted ${createdCount} replies.`);
    }

    return createdCount;
  } finally {
    isRunning = false;
  }
}

export function startReplyHunterWorker(): void {
  if (growthWorkerHandle) {
    return;
  }

  void runReplyHunterCycle();
  growthWorkerHandle = setInterval(() => {
    void runReplyHunterCycle();
  }, REPLY_HUNTER_INTERVAL_MS);
}
