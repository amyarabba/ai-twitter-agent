import { Router } from 'express';

import {
  getPostAnalytics,
  getTopPerformingPosts,
} from '../services/analyticsService.js';
import { getAnalyticsInsights } from '../services/analyticsInsightsService.js';

const analyticsRouter = Router();

analyticsRouter.get('/analytics/posts', (_request, response) => {
  response.json(getPostAnalytics());
});

analyticsRouter.get('/analytics/top', (_request, response) => {
  response.json(getTopPerformingPosts());
});

analyticsRouter.get('/analytics/insights', (_request, response) => {
  response.json(getAnalyticsInsights());
});

export { analyticsRouter };
