import { Router } from 'express';

import { getDashboardMetrics, getTrendSignals } from '../services/mockDataService.js';

const dashboardRouter = Router();

dashboardRouter.get('/dashboard', (_request, response) => {
  response.json(getDashboardMetrics());
});

dashboardRouter.get('/trends', (_request, response) => {
  response.json({
    generatedAt: new Date().toISOString(),
    items: getTrendSignals(),
  });
});

export { dashboardRouter };
