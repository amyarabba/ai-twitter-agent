import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { aiRouter } from './routes/aiRoutes.js';
import { getDatabasePath, initializeDatabase } from './db/database.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { generatorRouter } from './routes/generatorRoutes.js';
import { postsRouter } from './routes/postsRoutes.js';
import { startSchedulerService } from './services/schedulerService.js';

initializeDatabase();
startSchedulerService();

const app = express();

app.use(
  cors({
    origin: env.ALLOWED_ORIGIN ?? true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    mode: env.hasOpenAIKey ? 'openai' : 'fallback',
    model: env.OPENAI_MODEL,
    databasePath: getDatabasePath(),
    xPublishingReady: env.hasXCredentials,
    xAuthMode: env.xAuthMode,
  });
});

app.use('/api', dashboardRouter);
app.use('/api', generatorRouter);
app.use('/api', postsRouter);

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: 'Invalid request payload.',
        details: error.flatten(),
      });
      return;
    }

    if (error instanceof Error) {
      console.error(error);
      response.status(500).json({
        error: error.message,
      });
      return;
    }

    console.error(error);

    response.status(500).json({
      error: 'Something went wrong while processing the request.',
    });
  },
);

app.listen(env.PORT, () => {
  console.log(
    `AI growth agent backend listening on http://localhost:${env.PORT} in ${
      env.hasOpenAIKey ? 'OpenAI' : 'fallback'
    } mode.`,
  );
});

