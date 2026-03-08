import { Router } from 'express';
import { z } from 'zod';

import {
  getReplyDrafts,
  updateReplyDraftStatus,
} from '../services/replyDraftRepository.js';
import {
  generateGrowthReply,
  getGrowthTargets,
} from '../services/replyHunterService.js';
import { runReplyHunterCycle } from '../services/growthWorkerService.js';

const replyRequestSchema = z
  .object({
    tweetText: z.string().trim().min(12).optional(),
    tweet_text: z.string().trim().min(12).optional(),
    author: z.string().trim().min(1),
  })
  .superRefine((value, context) => {
    if (!value.tweetText && !value.tweet_text) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tweet_text'],
        message: 'tweet_text is required.',
      });
    }
  });

const draftStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

function serializeTarget(
  target: Awaited<ReturnType<typeof getGrowthTargets>>['items'][number],
) {
  return {
    tweet_id: target.tweetId,
    author: target.author,
    text: target.text,
    likes: target.likes,
    reposts: target.reposts,
    replies: target.replies,
    created_at: target.createdAt,
  };
}

function serializeReplyDraft(
  draft: Awaited<ReturnType<typeof getReplyDrafts>>[number],
) {
  return {
    id: draft.id,
    tweet_id: draft.tweetId,
    tweet_text: draft.tweetText,
    reply_text: draft.replyText,
    created_at: draft.createdAt,
    status: draft.status,
    reply_post_id: draft.replyPostId,
    posted_at: draft.postedAt,
  };
}

const growthRouter = Router();

growthRouter.get('/growth/targets', async (_request, response, next) => {
  try {
    const targets = await getGrowthTargets();

    response.json({
      generated_at: targets.generatedAt,
      items: targets.items.map(serializeTarget),
    });
  } catch (error) {
    next(error);
  }
});

growthRouter.post('/growth/reply', async (request, response, next) => {
  try {
    const payload = replyRequestSchema.parse(request.body);
    const reply = await generateGrowthReply({
      tweetText: payload.tweet_text ?? payload.tweetText ?? '',
      author: payload.author,
    });

    response.json({
      reply_text: reply.replyText,
    });
  } catch (error) {
    next(error);
  }
});

growthRouter.get('/growth/replies', (_request, response) => {
  response.json({
    generated_at: new Date().toISOString(),
    items: getReplyDrafts().map(serializeReplyDraft),
  });
});

growthRouter.patch('/growth/replies/:id', (request, response, next) => {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      response.status(400).json({
        error: 'Invalid reply draft id.',
      });
      return;
    }

    const payload = draftStatusSchema.parse(request.body);
    const draft = updateReplyDraftStatus({
      id,
      status: payload.status,
    });

    if (!draft) {
      response.status(404).json({
        error: 'Reply draft not found.',
      });
      return;
    }

    response.json({
      draft: serializeReplyDraft(draft),
    });
  } catch (error) {
    next(error);
  }
});

growthRouter.post('/growth/run', async (_request, response, next) => {
  try {
    const created = await runReplyHunterCycle();

    response.json({
      created,
    });
  } catch (error) {
    next(error);
  }
});

export { growthRouter };
