import { Activity, Eye, ExternalLink, RefreshCw, Trophy, Users } from 'lucide-react';

import { SectionCard } from '../SectionCard';
import type {
  AnalyticsPost,
  AnalyticsPostsResponse,
  DashboardMetrics,
  QueueContent,
  TopPostsResponse,
} from '../../types';

interface AnalyticsDashboardProps {
  analyticsResponse: AnalyticsPostsResponse | null;
  topPostsResponse: TopPostsResponse | null;
  dashboard: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

interface SeriesPoint {
  label: string;
  value: number;
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

function previewContent(content: QueueContent): string {
  const text = Array.isArray(content) ? content[0] ?? '' : content;
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function buildSeries(posts: AnalyticsPost[], key: 'impressions' | 'totalEngagement'): SeriesPoint[] {
  const buckets = new Map<string, { timestamp: number; value: number }>();

  for (const post of posts) {
    const createdAt = new Date(post.createdAt);
    const bucketKey = createdAt.toISOString().slice(0, 10);
    const existing = buckets.get(bucketKey);
    const nextValue = (existing?.value ?? 0) + post[key];

    buckets.set(bucketKey, {
      timestamp: createdAt.getTime(),
      value: nextValue,
    });
  }

  return Array.from(buckets.entries())
    .map(([key, value]) => ({
      label: new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).format(new Date(key)),
      value: value.value,
      timestamp: value.timestamp,
    }))
    .sort((left, right) => left.timestamp - right.timestamp)
    .map(({ label, value }) => ({ label, value }));
}

function AnalyticsTrendChart({
  title,
  subtitle,
  points,
  accentClass,
}: {
  title: string;
  subtitle: string;
  points: SeriesPoint[];
  accentClass: string;
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
        No posted content yet, so this chart will populate after the next publish cycle.
      </div>
    );
  }

  const width = 640;
  const height = 250;
  const paddingX = 28;
  const paddingTop = 24;
  const paddingBottom = 36;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const xStep = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const linePoints = points
    .map((point, index) => {
      const x = paddingX + xStep * index;
      const y = paddingTop + chartHeight - (point.value / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${paddingX},${height - paddingBottom} ${linePoints} ${width - paddingX},${height - paddingBottom}`;

  return (
    <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</p>
          <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
        </div>
        <Activity className={`h-5 w-5 ${accentClass}`} />
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-white/3 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-64 w-full"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id={`area-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.3)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
            </linearGradient>
            <linearGradient id={`line-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#bef264" />
            </linearGradient>
          </defs>

          <polygon points={areaPoints} fill={`url(#area-${title})`} />
          <polyline
            points={linePoints}
            fill="none"
            stroke={`url(#line-${title})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const x = paddingX + xStep * index;
            const y = paddingTop + chartHeight - (point.value / maxValue) * chartHeight;

            return (
              <g key={`${title}-${point.label}`}>
                <circle cx={x} cy={y} r="5" fill="#0f172a" stroke="#67e8f9" strokeWidth="3" />
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fill="rgba(148,163,184,0.8)"
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

export function AnalyticsDashboard({
  analyticsResponse,
  topPostsResponse,
  dashboard,
  isLoading,
  error,
  onRefresh,
}: AnalyticsDashboardProps) {
  const posts = analyticsResponse?.items ?? [];
  const topPosts = topPostsResponse?.items ?? [];
  const totalImpressions = posts.reduce((sum, post) => sum + post.impressions, 0);
  const totalEngagement = posts.reduce((sum, post) => sum + post.totalEngagement, 0);
  const averageEngagementRate = posts.length
    ? Number(
        (
          posts.reduce((sum, post) => sum + post.engagementRate, 0) / posts.length
        ).toFixed(2),
      )
    : 0;
  const followerGrowth = dashboard?.growthSeries.length
    ? dashboard.growthSeries.at(-1)!.followers - dashboard.growthSeries[0]!.followers
    : 0;
  const impressionsSeries = buildSeries(posts, 'impressions');
  const engagementSeries = buildSeries(posts, 'totalEngagement');

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Analytics"
        title="Track performance and learn which posts deserve more repetition"
        description="Use simulated X analytics for now to understand what content shapes, tones, and thread formats are creating the strongest engagement profile."
        action={
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh analytics
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-2 text-slate-200">
              <Eye className="h-4 w-4" />
              <p className="text-sm font-medium">Total impressions</p>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {formatCompactNumber(totalImpressions)}
            </p>
          </div>
          <div className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-2 text-slate-200">
              <Activity className="h-4 w-4" />
              <p className="text-sm font-medium">Total engagement</p>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {formatCompactNumber(totalEngagement)}
            </p>
          </div>
          <div className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-2 text-slate-200">
              <Users className="h-4 w-4" />
              <p className="text-sm font-medium">Follower growth</p>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              +{followerGrowth.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {dashboard ? `${dashboard.followerDelta}% week-over-week` : 'Using dashboard data'}
            </p>
          </div>
          <div className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-2 text-slate-200">
              <Trophy className="h-4 w-4" />
              <p className="text-sm font-medium">Avg engagement rate</p>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {averageEngagementRate}%
            </p>
          </div>
        </div>
      </SectionCard>

      {error ? (
        <div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {isLoading && posts.length === 0 ? (
        <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-12 text-center text-sm text-slate-300">
          Loading analytics telemetry...
        </div>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsTrendChart
              title="Engagement over time"
              subtitle="Daily total of likes, replies, and reposts from posted content"
              points={engagementSeries}
              accentClass="text-cyan-200"
            />
            <AnalyticsTrendChart
              title="Impressions over time"
              subtitle="Daily impression volume across posted tweets and threads"
              points={impressionsSeries}
              accentClass="text-lime-200"
            />
          </section>

          <SectionCard
            eyebrow="Top performers"
            title="Posts with the strongest engagement rate"
            description={`Updated ${formatTimestamp(topPostsResponse?.generatedAt)}. Use these winners to inform future content generation and hook styles.`}
          >
            {topPosts.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
                No posted content yet. Publish a few items and this ranking will fill automatically.
              </div>
            ) : (
              <div className="grid gap-4">
                {topPosts.map((post, index) => (
                  <article
                    key={post.id}
                    className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-200">
                            #{index + 1}
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-200">
                            {post.type}
                          </span>
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100 ring-1 ring-cyan-400/25">
                            {post.engagementRate}% engagement
                          </span>
                        </div>
                        <p className="max-w-3xl text-sm leading-6 text-slate-100">
                          {previewContent(post.content)}
                        </p>
                        <p className="text-sm text-slate-400">
                          Published {formatTimestamp(post.createdAt)}
                        </p>
                      </div>

                      {post.xPostId ? (
                        <a
                          href={`https://x.com/i/web/status/${post.xPostId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/15"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View on X
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-5">
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Impressions</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactNumber(post.impressions)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Likes</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactNumber(post.likes)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Replies</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactNumber(post.replies)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Reposts</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactNumber(post.reposts)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Total engagement</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactNumber(post.totalEngagement)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}


