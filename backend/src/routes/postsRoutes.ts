import { Router } from 'express';
import { z } from 'zod';

import {
  deletePost,
  getAllPosts,
  saveDraftPost,
  schedulePost,
} from '../services/postRepository.js';
import { runSchedulerCycle } from '../services/schedulerService.js';

const postTypeSchema = z.enum(['tweet', 'thread']);
const scheduledTimeSchema = z
  .string()
  .trim()
  .min(5)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Invalid scheduled time.',
  });

const postContentSchema = z.union([
  z.string().trim().min(1),
  z.array(z.string().trim().min(1)).min(2),
]);

const saveDraftSchema = z
  .object({
    content: postContentSchema,
    type: postTypeSchema,
  })
  .superRefine((value, context) => {
    if (value.type === 'tweet' && Array.isArray(value.content)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Tweet drafts must use string content.',
      });
    }

    if (value.type === 'thread' && !Array.isArray(value.content)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Thread drafts must use an array of posts.',
      });
    }
  });

const schedulePostSchema = z
  .object({
    postId: z.number().int().positive().optional(),
    content: postContentSchema.optional(),
    type: postTypeSchema.optional(),
    scheduledTime: scheduledTimeSchema,
  })
  .superRefine((value, context) => {
    if (!value.postId && (!value.content || !value.type)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Provide content and type when scheduling a new post.',
      });
    }

    if (value.type === 'tweet' && Array.isArray(value.content)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Tweet schedules must use string content.',
      });
    }

    if (value.type === 'thread' && value.content && !Array.isArray(value.content)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Thread schedules must use an array of posts.',
      });
    }
  });

const postsRouter = Router();

postsRouter.post('/posts/save', (request, response, next) => {
  try {
    const payload = saveDraftSchema.parse(request.body);
    const post = saveDraftPost(payload);

    response.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

postsRouter.post('/posts/schedule', (request, response, next) => {
  try {
    const payload = schedulePostSchema.parse(request.body);
    const post = schedulePost({
      scheduledTime: payload.scheduledTime,
      ...(payload.postId ? { postId: payload.postId } : {}),
      ...(payload.content ? { content: payload.content } : {}),
      ...(payload.type ? { type: payload.type } : {}),
    });
    void runSchedulerCycle();

    response.json({ post });
  } catch (error) {
    next(error);
  }
});

postsRouter.get('/posts', (_request, response) => {
  response.json({
    items: getAllPosts(),
  });
});

postsRouter.delete('/posts/:id', (request, response, next) => {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      response.status(400).json({
        error: 'Invalid post id.',
      });
      return;
    }

    const deleted = deletePost(id);

    if (!deleted) {
      response.status(404).json({
        error: 'Post not found.',
      });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { postsRouter };


