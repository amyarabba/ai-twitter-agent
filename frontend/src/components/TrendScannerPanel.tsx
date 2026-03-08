import type { TrendTopic } from '../types';

interface TrendScannerPanelProps {
  generatedAt?: string;
  trends: TrendTopic[];
  onUseTopic?: (topic: string) => void;
}

const momentumClasses: Record<TrendTopic['momentum'], string> = {
  Exploding: 'bg-cyan-400/12 text-cyan-200 ring-cyan-400/25',
  Rising: 'bg-lime-400/12 text-lime-200 ring-lime-400/25',
  Watchlist: 'bg-amber-400/12 text-amber-200 ring-amber-400/25',
};

export function TrendScannerPanel({
  generatedAt,
  trends,
  onUseTopic,
}: TrendScannerPanelProps) {
  const scanTime = generatedAt
    ? new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(generatedAt))
    : 'Just now';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
        <span>Trend scan refreshed at {scanTime}</span>
        <span className="inline-flex items-center gap-2 text-cyan-200">
          <span className="status-dot" />
          5 suggested topics live
        </span>
      </div>

      <div className="grid gap-4">
        {trends.map((trend) => (
          <article
            key={trend.id}
            className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-200">
                    {trend.category}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${momentumClasses[trend.momentum]}`}
                  >
                    {trend.momentum}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white">{trend.title}</h3>
                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                  {trend.angle}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Suggested post angle
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {trend.suggestedPost}
              </p>
            </div>

            {onUseTopic ? (
              <button
                type="button"
                onClick={() => {
                  onUseTopic(trend.title);
                }}
                className="mt-4 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/15"
              >
                Use topic
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
