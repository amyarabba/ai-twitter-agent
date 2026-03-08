import { Router } from 'express';
import { z } from 'zod';

import {
  generateViralHooks,
  getAiTopics,
  getCompetitorRadar,
} from '../services/aiDiscoveryService.js';

const requestSchema = z.object({
  topic: z.string().trim().min(4),
});

const aiRouter = Router();

aiRouter.get('/ai/topics', async (_request, response, next) => {
  try {
    response.json(await getAiTopics());
  } catch (error) {
    next(error);
  }
});

aiRouter.post('/ai/hooks', async (request, response, next) => {
  try {
    const payload = requestSchema.parse(request.body);
    response.json(await generateViralHooks(payload));
  } catch (error) {
    next(error);
  }
});

aiRouter.get('/ai/competitors', async (_request, response, next) => {
  try {
    response.json(await getCompetitorRadar());
  } catch (error) {
    next(error);
  }
});

export { aiRouter };
