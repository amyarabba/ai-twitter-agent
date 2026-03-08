import { getContentInsights, replaceContentInsights } from './contentInsightsRepository.js';
import { getDashboardMetrics } from './mockDataService.js';
import { getAllPosts, resolvePostEngagement } from './postRepository.js';
import type {
  AnalyticsInsightsResponse,
  ContentInsight,
  EngagementTrendPoint,
  HookStyleInsight,
  PostContent,
  PostType,
  PostingTimeInsight,
  QueuePost,
} from '../types/content.js';

interface AnalyticsSample {
  topic: string;
  hookStyle: string;
  postingTime: string;
  engagementRate: number;
  impressions: number;
  timestamp: string;
  type: PostType;
}

interface TopicProfile {
  label: string;
  keywords: string[];
}

const postingTimeOrder = ['Morning', 'Afternoon', 'Evening', 'Late night'];
const topicProfiles: TopicProfile[] = [
  {
    label: 'AI agents',
    keywords: ['agent', 'agents', 'workflow', 'autonomous', 'operator', 'automation'],
  },
  {
    label: 'Open source AI',
    keywords: ['open source', 'open model', 'llama', 'mistral', 'weights'],
  },
  {
    label: 'Robotics',
    keywords: ['robot', 'robotics', 'warehouse', 'physical ai', 'automation hardware'],
  },
  {
    label: 'AI startups',
    keywords: ['startup', 'funding', 'seed', 'series a', 'venture', 'founder'],
  },
  {
    label: 'New models',
    keywords: ['model', 'models', 'reasoning', 'benchmark', 'multimodal', 'inference'],
  },
  {
    label: 'AI tools',
    keywords: ['tool', 'copilot', 'assistant', 'workflow tool', 'voice agent'],
  },
  {
    label: 'AI research',
    keywords: ['research', 'paper', 'lab', 'breakthrough', 'evaluation', 'alignment'],
  },
];

function round(value: number): number {
  return Number(value.toFixed(2));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function flattenContent(content: PostContent): string {
  return Array.isArray(content) ? content.join(' ') : content;
}

function inferTopic(content: PostContent): string {
  const normalized = flattenContent(content).toLowerCase();
  let bestMatch: { label: string; score: number } | null = null;

  for (const profile of topicProfiles) {
    const score = profile.keywords.reduce(
      (sum, keyword) => sum + (normalized.includes(keyword) ? 1 : 0),
      0,
    );

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        label: profile.label,
        score,
      };
    }
  }

  return bestMatch?.label ?? 'AI industry shifts';
}

function classifyHookStyle(content: PostContent): string {
  const text = flattenContent(content).trim();
  const firstLine = text.split('\n')[0]?.trim() ?? text;
  const normalized = firstLine.toLowerCase();

  if (normalized.startsWith('hot take') || normalized.includes('underestimated')) {
    return 'Contrarian';
  }

  if (firstLine.includes('?')) {
    return 'Question-led';
  }

  if (/^(\d+\.|\d+\)|\d+\s)/.test(firstLine)) {
    return 'List-led';
  }

  if (normalized.startsWith('prediction') || normalized.includes('expect ')) {
    return 'Prediction';
  }

  if (normalized.includes('data') || normalized.includes('numbers') || normalized.includes('signal')) {
    return 'Data-led';
  }

  if (normalized.includes('why ') || normalized.includes('how ') || normalized.includes('the real shift')) {
    return 'Explainer';
  }

  return 'Insight-led';
}

function classifyPostingTime(timestamp: string): string {
  const hour = new Date(timestamp).getHours();

  if (hour >= 6 && hour < 12) {
    return 'Morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'Afternoon';
  }

  if (hour >= 17 && hour < 22) {
    return 'Evening';
  }

  return 'Late night';
}

function buildSamples(): AnalyticsSample[] {
  return getAllPosts()
    .filter((post) => post.status === 'posted')
    .map((post) => toAnalyticsSample(post))
    .filter((sample): sample is AnalyticsSample => sample !== null);
}

function toAnalyticsSample(post: QueuePost): AnalyticsSample | null {
  const engagement = resolvePostEngagement(post);

  if (!engagement) {
    return null;
  }

  const timestamp = engagement.timestamp || post.createdAt;

  return {
    topic: inferTopic(post.content),
    hookStyle: classifyHookStyle(post.content),
    postingTime: classifyPostingTime(timestamp),
    engagementRate: engagement.engagementRate,
    impressions: engagement.impressions,
    timestamp,
    type: post.type,
  };
}

function buildTopicInsights(samples: AnalyticsSample[]): ContentInsight[] {
  const nowIso = new Date().toISOString();
  const topicBuckets = new Map<string, AnalyticsSample[]>();

  for (const sample of samples) {
    const bucket = topicBuckets.get(sample.topic) ?? [];
    bucket.push(sample);
    topicBuckets.set(sample.topic, bucket);
  }

  return Array.from(topicBuckets.entries())
    .map(([topic, topicSamples]) => {
      const hookStyle = pickBestDimension(topicSamples, (sample) => sample.hookStyle);
      const postingTime = pickBestDimension(topicSamples, (sample) => sample.postingTime);

      return {
        topic,
        avgEngagement: round(average(topicSamples.map((sample) => sample.engagementRate))),
        bestHookStyle: hookStyle,
        bestPostTime: postingTime,
        lastUpdated: nowIso,
      };
    })
    .sort((left, right) => right.avgEngagement - left.avgEngagement)
    .slice(0, 10);
}

function buildPostingTimeInsights(samples: AnalyticsSample[]): PostingTimeInsight[] {
  const buckets = new Map<string, AnalyticsSample[]>();

  for (const label of postingTimeOrder) {
    buckets.set(label, []);
  }

  for (const sample of samples) {
    const bucket = buckets.get(sample.postingTime) ?? [];
    bucket.push(sample);
    buckets.set(sample.postingTime, bucket);
  }

  return Array.from(buckets.entries())
    .map(([label, bucketSamples]) => ({
      label,
      avgEngagementRate: round(average(bucketSamples.map((sample) => sample.engagementRate))),
      avgImpressions: Math.round(average(bucketSamples.map((sample) => sample.impressions))),
      postCount: bucketSamples.length,
    }))
    .sort((left, right) => {
      if (right.avgEngagementRate !== left.avgEngagementRate) {
        return right.avgEngagementRate - left.avgEngagementRate;
      }

      return right.avgImpressions - left.avgImpressions;
    });
}

function buildHookStyleInsights(samples: AnalyticsSample[]): HookStyleInsight[] {
  const buckets = new Map<string, AnalyticsSample[]>();

  for (const sample of samples) {
    const bucket = buckets.get(sample.hookStyle) ?? [];
    bucket.push(sample);
    buckets.set(sample.hookStyle, bucket);
  }

  return Array.from(buckets.entries())
    .map(([style, bucketSamples]) => ({
      style,
      avgEngagementRate: round(average(bucketSamples.map((sample) => sample.engagementRate))),
      postCount: bucketSamples.length,
    }))
    .sort((left, right) => {
      if (right.avgEngagementRate !== left.avgEngagementRate) {
        return right.avgEngagementRate - left.avgEngagementRate;
      }

      return right.postCount - left.postCount;
    })
    .slice(0, 5);
}

function buildEngagementTrends(samples: AnalyticsSample[]): EngagementTrendPoint[] {
  const buckets = new Map<
    string,
    { date: string; engagementRates: number[]; impressions: number; posts: number }
  >();

  for (const sample of samples) {
    const date = sample.timestamp.slice(0, 10);
    const bucket = buckets.get(date) ?? {
      date,
      engagementRates: [],
      impressions: 0,
      posts: 0,
    };

    bucket.engagementRates.push(sample.engagementRate);
    bucket.impressions += sample.impressions;
    bucket.posts += 1;
    buckets.set(date, bucket);
  }

  return Array.from(buckets.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((bucket) => ({
      label: new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).format(new Date(bucket.date)),
      date: bucket.date,
      avgEngagementRate: round(average(bucket.engagementRates)),
      impressions: bucket.impressions,
      posts: bucket.posts,
    }));
}

function pickBestDimension(
  samples: AnalyticsSample[],
  selector: (sample: AnalyticsSample) => string,
): string {
  const buckets = new Map<string, AnalyticsSample[]>();

  for (const sample of samples) {
    const key = selector(sample);
    const bucket = buckets.get(key) ?? [];
    bucket.push(sample);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .map(([key, bucketSamples]) => ({
      key,
      avgEngagementRate: average(bucketSamples.map((sample) => sample.engagementRate)),
      impressions: average(bucketSamples.map((sample) => sample.impressions)),
      postCount: bucketSamples.length,
    }))
    .sort((left, right) => {
      if (right.avgEngagementRate !== left.avgEngagementRate) {
        return right.avgEngagementRate - left.avgEngagementRate;
      }

      if (right.impressions !== left.impressions) {
        return right.impressions - left.impressions;
      }

      return right.postCount - left.postCount;
    })[0]?.key ?? 'Insight-led';
}

function buildFallbackTopicInsights(): ContentInsight[] {
  const dashboard = getDashboardMetrics();
  const nowIso = new Date().toISOString();

  return [
    {
      topic: 'AI agents',
      avgEngagement: round(dashboard.engagementRate + 1.1),
      bestHookStyle: 'Contrarian',
      bestPostTime: 'Morning',
      lastUpdated: nowIso,
    },
    {
      topic: 'Open source AI',
      avgEngagement: round(dashboard.engagementRate + 0.8),
      bestHookStyle: 'Data-led',
      bestPostTime: 'Afternoon',
      lastUpdated: nowIso,
    },
    {
      topic: 'Robotics',
      avgEngagement: round(dashboard.engagementRate + 0.5),
      bestHookStyle: 'Explainer',
      bestPostTime: 'Evening',
      lastUpdated: nowIso,
    },
    {
      topic: 'AI startups',
      avgEngagement: round(dashboard.engagementRate + 0.3),
      bestHookStyle: 'Prediction',
      bestPostTime: 'Afternoon',
      lastUpdated: nowIso,
    },
  ];
}

function buildFallbackPostingTimeInsights(): PostingTimeInsight[] {
  const dashboard = getDashboardMetrics();

  return [
    {
      label: 'Morning',
      avgEngagementRate: round(dashboard.engagementRate + 0.8),
      avgImpressions: Math.round(dashboard.impressions / 7 + 2200),
      postCount: 6,
    },
    {
      label: 'Afternoon',
      avgEngagementRate: round(dashboard.engagementRate + 0.5),
      avgImpressions: Math.round(dashboard.impressions / 7 + 1600),
      postCount: 5,
    },
    {
      label: 'Evening',
      avgEngagementRate: round(dashboard.engagementRate - 0.2),
      avgImpressions: Math.round(dashboard.impressions / 7 + 900),
      postCount: 4,
    },
    {
      label: 'Late night',
      avgEngagementRate: round(dashboard.engagementRate - 0.9),
      avgImpressions: Math.round(dashboard.impressions / 7 - 200),
      postCount: 3,
    },
  ];
}

function buildFallbackHookStyleInsights(): HookStyleInsight[] {
  const dashboard = getDashboardMetrics();

  return [
    {
      style: 'Contrarian',
      avgEngagementRate: round(dashboard.engagementRate + 0.9),
      postCount: 6,
    },
    {
      style: 'Insight-led',
      avgEngagementRate: round(dashboard.engagementRate + 0.4),
      postCount: 8,
    },
    {
      style: 'Data-led',
      avgEngagementRate: round(dashboard.engagementRate + 0.2),
      postCount: 4,
    },
    {
      style: 'Prediction',
      avgEngagementRate: round(dashboard.engagementRate - 0.1),
      postCount: 3,
    },
  ];
}

function buildFallbackEngagementTrends(): EngagementTrendPoint[] {
  const dashboard = getDashboardMetrics();
  const today = new Date();

  return dashboard.growthSeries.map((point, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (dashboard.growthSeries.length - index - 1));

    return {
      label: point.label,
      date: date.toISOString().slice(0, 10),
      avgEngagementRate: round(dashboard.engagementRate + (index - 3) * 0.14),
      impressions: point.impressions,
      posts: Math.max(2, Math.round(dashboard.postsPerDay - 2 + index / 2)),
    };
  });
}

function buildRecommendedContentStrategy(
  topicInsights: ContentInsight[],
  hookInsights: HookStyleInsight[],
  postingTimeInsights: PostingTimeInsight[],
  samples: AnalyticsSample[],
): string[] {
  const topTopic = topicInsights[0];
  const runnerUpTopic = topicInsights[1];
  const topHook = hookInsights[0];
  const backupHook = hookInsights[1];
  const primaryWindow = postingTimeInsights[0];
  const secondaryWindow = postingTimeInsights[1];
  const bestType = pickBestPostType(samples);

  return [
    topTopic
      ? `Lean harder into ${topTopic.topic} because it is producing the strongest average engagement so far.`
      : 'Keep leaning into AI workflow themes that create a clear opinion and a clear takeaway.',
    primaryWindow
      ? `${primaryWindow.label} is the strongest posting window${secondaryWindow ? `, with ${secondaryWindow.label.toLowerCase()} as the backup slot` : ''}.`
      : 'Morning and afternoon windows are the safest posting slots right now.',
    topHook
      ? `${topHook.style} hooks are outperforming weaker openers${backupHook ? `, with ${backupHook.style.toLowerCase()} as the secondary pattern` : ''}.`
      : 'Open with a sharper first line that creates curiosity before the explanation.',
    bestType === 'thread'
      ? 'Use six-post threads for nuanced market shifts, and keep them short enough that each tweet lands on its own.'
      : 'Lead with concise single-post takes for fast-moving news, then use threads only when the extra depth earns attention.',
    runnerUpTopic
      ? `Pair ${topTopic?.topic ?? 'top topics'} with ${runnerUpTopic.topic} in future experiments to find the next repeatable content lane.`
      : 'Pair a strong hook with one concrete implication for builders, founders, or researchers.',
  ];
}

function pickBestPostType(samples: AnalyticsSample[]): PostType {
  if (samples.length === 0) {
    return 'tweet';
  }

  const typeBuckets = new Map<PostType, AnalyticsSample[]>();

  for (const sample of samples) {
    const bucket = typeBuckets.get(sample.type) ?? [];
    bucket.push(sample);
    typeBuckets.set(sample.type, bucket);
  }

  return Array.from(typeBuckets.entries())
    .map(([type, bucketSamples]) => ({
      type,
      avgEngagementRate: average(bucketSamples.map((sample) => sample.engagementRate)),
      avgImpressions: average(bucketSamples.map((sample) => sample.impressions)),
    }))
    .sort((left, right) => {
      if (right.avgEngagementRate !== left.avgEngagementRate) {
        return right.avgEngagementRate - left.avgEngagementRate;
      }

      return right.avgImpressions - left.avgImpressions;
    })[0]?.type ?? 'tweet';
}

export function refreshStoredContentInsights(): ContentInsight[] {
  const samples = buildSamples();
  const topicInsights = samples.length > 0 ? buildTopicInsights(samples) : buildFallbackTopicInsights();

  replaceContentInsights(topicInsights);
  return topicInsights;
}

export function getAnalyticsInsights(): AnalyticsInsightsResponse {
  const samples = buildSamples();
  let topicInsights = getContentInsights();

  if (topicInsights.length === 0) {
    topicInsights = refreshStoredContentInsights();
  }

  const postingTimeInsights =
    samples.length > 0 ? buildPostingTimeInsights(samples) : buildFallbackPostingTimeInsights();
  const hookInsights =
    samples.length > 0 ? buildHookStyleInsights(samples) : buildFallbackHookStyleInsights();
  const engagementTrends =
    samples.length > 0 ? buildEngagementTrends(samples) : buildFallbackEngagementTrends();
  const averageEngagementRate = samples.length > 0
    ? round(average(samples.map((sample) => sample.engagementRate)))
    : round(getDashboardMetrics().engagementRate);

  return {
    generatedAt: new Date().toISOString(),
    bestPostingTime: postingTimeInsights[0]?.label ?? topicInsights[0]?.bestPostTime ?? 'Morning',
    bestPerformingTopics: topicInsights.slice(0, 5),
    bestPerformingHookStyles: hookInsights.slice(0, 5),
    bestPostingTimes: postingTimeInsights.slice(0, 4),
    averageEngagementRate,
    recommendedContentStrategy: buildRecommendedContentStrategy(
      topicInsights,
      hookInsights,
      postingTimeInsights,
      samples,
    ),
    engagementTrends,
  };
}
