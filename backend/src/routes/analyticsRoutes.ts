import { Router } from 'express';

import {
  getPostAnalytics,
  getTopPerformingPosts,
} from '../services/analyticsService.js';

const analyticsRouter = Router();

analyticsRouter.get('/analytics/posts', (_request, response) => {
  response.json(getPostAnalytics());
});

analyticsRouter.get('/analytics/top', (_request, response) => {
  response.json(getTopPerformingPosts());
});

export { analyticsRouter };
