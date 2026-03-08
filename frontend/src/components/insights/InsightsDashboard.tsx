import {
  Activity,
  BarChart3,
  Clock3,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';

import { SectionCard } from '../SectionCard';
import type { AnalyticsInsightsResponse } from '../../types';

interface InsightsDashboardProps {
  insightsResponse: AnalyticsInsightsResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenGenerator: () => void;
}

interface TrendPoint {
  label: string;
  avgEngagementRate: number;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function EngagementTrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
        No engagement trend data yet. Publish a few posts and this trend chart will fill in automatically.
      </div>
    );
  }

  const width = 640;
  const height = 240;
  const paddingX = 28;
  const paddingTop = 24;
  const paddingBottom = 38;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...points.map((point) => point.avgEngagementRate), 1);
  const xStep = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const linePoints = points
    .map((point, index) => {
      const x = paddingX + xStep * index;
      const y = paddingTop + chartHeight - (point.avgEngagementRate / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${paddingX},${height - paddingBottom} ${linePoints} ${width - paddingX},${height - paddingBottom}`;

  return (
    <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Engagement trend</p>
          <p className="mt-2 text-sm text-slate-300">
            Average engagement rate over time from posted content
          </p>
        </div>
        <Activity className="h-5 w-5 text-cyan-200" />
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-white/3 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Engagement trend">
          <defs>
            <linearGradient id="insights-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.32)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
            </linearGradient>
            <linearGradient id="insights-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
          </defs>

          <polygon points={areaPoints} fill="url(#insights-area)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="url(#insights-line)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const x = paddingX + xStep * index;
            const y = paddingTop + chartHeight - (point.avgEngagementRate / maxValue) * chartHeight;

            return (
              <g key={point.label}>
                <circle cx={x} cy={y} r="5" fill="#0f172a" stroke="#67e8f9" strokeWidth="3" />
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  fill="rgba(148,163,184,0.82)"
                  fontSize="11"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function InsightsDashboard({
  insightsResponse,
  isLoading,
  error,
  onRefresh,
  onOpenGenerator,
}: InsightsDashboardProps) {
  const insights = insightsResponse;
  const bestTopic = insights?.bestPerformingTopics[0] ?? null;
  const bestHook = insights?.bestPerformingHookStyles[0] ?? null;
  const bestTime = insights?.bestPostingTimes[0] ?? null;
  const trendPoints =
    insights?.engagementTrends.map((point) => ({
      label: point.label,
      avgEngagementRate: point.avgEngagementRate,
    })) ?? [];

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Insights Engine"
        title="Turn post history into content strategy"
        description="The daily insights worker ranks winning topics, hook styles, and posting windows so the next generation cycle can make sharper choices."
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenGenerator}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              <Sparkles className="h-4 w-4" />
              Open Generator
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh insights
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-2 text-slate-200">
              <Clock3 className="h-4 w-4" />
              <p className="text-sm font-medium">Best posting time</p>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {insights?.bestPostingTime ?? 'Morning'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {bestTime ? `${bestTime.avgEngagementRate}% avg engagement rate` : 'Based on current analytics'}
            </p>
          </div>
          <div className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-2 text-slate-200">
              <BarChart3 className="h-4 w-4" />
              <p className="text-sm font-medium">Avg engagement rate</p>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {insights ? `${insights.averageEngagementRate}%` : '0%'}
            </p>
          </div>
          <div className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-2 text-slate-200">
              <Target className="h-4 w-4" />
              <p className="text-sm font-medium">Top topic</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {bestTopic?.topic ?? 'AI agents'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {bestTopic ? `${bestTopic.avgEngagement}% avg engagement` : 'Waiting for ranked topic data'}
            </p>
          </div>
          <div className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-2 text-slate-200">
              <Lightbulb className="h-4 w-4" />
              <p className="text-sm font-medium">Winning hook style</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {bestHook?.style ?? 'Contrarian'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {bestHook ? `${bestHook.avgEngagementRate}% avg engagement rate` : 'Lead with a stronger opener'}
            </p>
          </div>
        </div>
      </SectionCard>

      {error ? (
        <div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {isLoading && !insights ? (
        <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-12 text-center text-sm text-slate-300">
          Building the latest content optimization insights...
        </div>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard
              eyebrow="Best Topics"
              title="What themes keep outperforming"
              description={`Updated ${formatTimestamp(insights?.generatedAt)}. These topic lanes are feeding the optimization layer.`}
            >
              {insights?.bestPerformingTopics.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {insights.bestPerformingTopics.map((topic) => (
                    <article
                      key={topic.topic}
                      className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-white">{topic.topic}</p>
                          <p className="mt-2 text-sm text-slate-400">
                            {topic.avgEngagement}% avg engagement
                          </p>
                        </div>
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100 ring-1 ring-cyan-400/25">
                          {topic.bestHookStyle}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Best hook</p>
                          <p className="mt-2 text-sm font-semibold text-white">{topic.bestHookStyle}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Best time</p>
                          <p className="mt-2 text-sm font-semibold text-white">{topic.bestPostTime}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
                  Topic insights will appear after the analytics worker has enough posted content to analyze.
                </div>
              )}
            </SectionCard>

            <SectionCard
              eyebrow="Strategy"
              title="Recommended content strategy"
              description="These recommendations are generated from topic winners, hook-style performance, and posting-time data."
            >
              {insights?.recommendedContentStrategy.length ? (
                <div className="grid gap-4">
                  {insights.recommendedContentStrategy.map((item, index) => (
                    <article
                      key={`${index}-${item}`}
                      className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/25">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6 text-slate-200">{item}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
                  Strategy guidance will appear once the insights worker processes posted content.
                </div>
              )}
            </SectionCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard
              eyebrow="Best Times"
              title="Posting windows with the strongest engagement"
              description="Use these windows to decide when optimized content should hit the queue."
            >
              {insights?.bestPostingTimes.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {insights.bestPostingTimes.map((timeSlot) => (
                    <article
                      key={timeSlot.label}
                      className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-lg font-semibold text-white">{timeSlot.label}</p>
                        <Clock3 className="h-5 w-5 text-cyan-200" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Avg engagement</p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {timeSlot.avgEngagementRate}%
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Avg impressions</p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {formatCompactNumber(timeSlot.avgImpressions)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">{timeSlot.postCount} analyzed posts in this window</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
                  Posting-time insights will appear here after the worker runs.
                </div>
              )}
            </SectionCard>

            <SectionCard
              eyebrow="Hook Styles"
              title="Openers that are winning attention"
              description="These hook patterns are performing best and now inform the optimized content generator."
            >
              {insights?.bestPerformingHookStyles.length ? (
                <div className="grid gap-4">
                  {insights.bestPerformingHookStyles.map((hook) => (
                    <article
                      key={hook.style}
                      className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-base font-semibold text-white">{hook.style}</p>
                        <span className="rounded-full bg-lime-500/10 px-3 py-1 text-xs text-lime-100 ring-1 ring-lime-400/25">
                          {hook.avgEngagementRate}% ER
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">
                        {hook.postCount} analyzed posts used this style.
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
                  Hook-style insights will populate after the next analytics refresh.
                </div>
              )}
            </SectionCard>
          </section>

          <EngagementTrendChart points={trendPoints} />
        </>
      )}
    </div>
  );
}
