import { Router } from 'express';
import { z } from 'zod';

import { generateContent } from '../services/contentService.js';

const requestSchema = z.object({
  topic: z.string().trim().min(4),
});

const generatorRouter = Router();

generatorRouter.post('/generate', async (request, response, next) => {
  try {
    const payload = requestSchema.parse(request.body);
    const content = await generateContent(payload);

    response.json(content);
  } catch (error) {
    next(error);
  }
});

export { generatorRouter };
