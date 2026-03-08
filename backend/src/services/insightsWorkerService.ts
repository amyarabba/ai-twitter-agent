import { refreshStoredContentInsights } from './analyticsInsightsService.js';

const INSIGHTS_INTERVAL_MS = 24 * 60 * 60 * 1000;

let insightsWorkerHandle: NodeJS.Timeout | null = null;
let isRunning = false;

export async function runInsightsRefreshCycle(): Promise<number> {
  if (isRunning) {
    return 0;
  }

  isRunning = true;

  try {
    const rows = refreshStoredContentInsights();

    if (rows.length > 0) {
      console.log(`[InsightsWorker] Refreshed ${rows.length} content insight row(s).`);
    }

    return rows.length;
  } finally {
    isRunning = false;
  }
}

export function startInsightsWorker(): void {
  if (insightsWorkerHandle) {
    return;
  }

  void runInsightsRefreshCycle();
  insightsWorkerHandle = setInterval(() => {
    void runInsightsRefreshCycle();
  }, INSIGHTS_INTERVAL_MS);
}
