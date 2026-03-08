import { useDeferredValue, useEffect, useState, useTransition, type FormEvent } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarClock,
  Compass,
  Flame,
  Gauge,
  LayoutDashboard,
  MessageSquareQuote,
  RefreshCw,
  Rows3,
  Send,
  Users,
} from 'lucide-react';

import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { GeneratedContentCard } from './components/GeneratedContentCard';
import { GrowthChart } from './components/GrowthChart';
import { GrowthLab } from './components/growth/GrowthLab';
import { MetricCard } from './components/MetricCard';
import { ReplyHunter } from './components/reply/ReplyHunter';
import { SchedulerPanel } from './components/SchedulerPanel';
import { SectionCard } from './components/SectionCard';
import { TrendScannerPanel } from './components/TrendScannerPanel';
import { QueueManager } from './components/queue/QueueManager';
import { api } from './services/api';
import type {
  AiTopicsResponse,
  AnalyticsPostsResponse,
  CompetitorRadarResponse,
  DashboardMetrics,
  GenerateContentResponse,
  GrowthTargetsResponse,
  QueueContent,
  QueuePost,
  QueuePostType,
  ReplyDraftsResponse,
  TopPostsResponse,
  TrendResponse,
  ViralHooksResponse,
} from './types';

const topicPresets = [
  'AI agents replacing SaaS',
  'New open source models',
  'Robotics breakthroughs',
  'AI startups funding',
  'Multimodal AI',
];

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function normalizeLocalDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Enter a valid date and time.');
  }

  return date.toISOString();
}

function previewContent(content: QueueContent | null | undefined): string {
  if (!content) {
    return 'No post data yet.';
  }

  const text = Array.isArray(content) ? content[0] ?? '' : content;
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function App() {
  const [activeView, setActiveView] = useState<
    'command-center' | 'queue-manager' | 'growth-lab' | 'analytics' | 'reply-hunter'
  >('command-center');
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [trendResponse, setTrendResponse] = useState<TrendResponse | null>(null);
  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [aiTopics, setAiTopics] = useState<AiTopicsResponse | null>(null);
  const [competitorRadar, setCompetitorRadar] =
    useState<CompetitorRadarResponse | null>(null);
  const [analyticsResponse, setAnalyticsResponse] =
    useState<AnalyticsPostsResponse | null>(null);
  const [topPostsResponse, setTopPostsResponse] =
    useState<TopPostsResponse | null>(null);
  const [growthTargetsResponse, setGrowthTargetsResponse] =
    useState<GrowthTargetsResponse | null>(null);
  const [replyDraftsResponse, setReplyDraftsResponse] =
    useState<ReplyDraftsResponse | null>(null);
  const [topic, setTopic] = useState('AI agents replacing SaaS');
  const [hookTopic, setHookTopic] = useState('AI agents replacing SaaS');
  const [generatedContent, setGeneratedContent] =
    useState<GenerateContentResponse | null>(null);
  const [hookIdeas, setHookIdeas] = useState<ViralHooksResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [growthError, setGrowthError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [replyHunterError, setReplyHunterError] = useState<string | null>(null);
  const [replyHunterMessage, setReplyHunterMessage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [hookError, setHookError] = useState<string | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isLoadingReplyHunter, setIsLoadingReplyHunter] = useState(true);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [replyHunterBusyAction, setReplyHunterBusyAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deferredTopic = useDeferredValue(topic);

  useEffect(() => {
    let isActive = true;

    async function loadAppData() {
      setIsLoadingDashboard(true);
      setIsLoadingPosts(true);
      setLoadError(null);

      try {
        const [dashboardData, trendData, postsData] = await Promise.all([
          api.getDashboard(),
          api.getTrends(),
          api.getPosts(),
        ]);

        if (!isActive) {
          return;
        }

        setDashboard(dashboardData);
        setTrendResponse(trendData);
        setPosts(postsData.items);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Failed to load application data.',
        );
      } finally {
        if (isActive) {
          setIsLoadingDashboard(false);
          setIsLoadingPosts(false);
        }
      }
    }

    void loadAppData();

    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  useEffect(() => {
    let isActive = true;

    async function loadGrowthData() {
      setIsLoadingGrowth(true);
      setGrowthError(null);

      try {
        const [topicsData, competitorsData] = await Promise.all([
          api.getAiTopics(),
          api.getAiCompetitors(),
        ]);

        if (!isActive) {
          return;
        }

        setAiTopics(topicsData);
        setCompetitorRadar(competitorsData);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setGrowthError(
          error instanceof Error ? error.message : 'Failed to load the Growth Lab.',
        );
      } finally {
        if (isActive) {
          setIsLoadingGrowth(false);
        }
      }
    }

    void loadGrowthData();

    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  useEffect(() => {
    let isActive = true;

    async function loadAnalyticsData() {
      setIsLoadingAnalytics(true);
      setAnalyticsError(null);

      try {
        const [analyticsData, topData] = await Promise.all([
          api.getPostAnalytics(),
          api.getTopPosts(),
        ]);

        if (!isActive) {
          return;
        }

        setAnalyticsResponse(analyticsData);
        setTopPostsResponse(topData);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setAnalyticsError(
          error instanceof Error ? error.message : 'Failed to load analytics.',
        );
      } finally {
        if (isActive) {
          setIsLoadingAnalytics(false);
        }
      }
    }

    void loadAnalyticsData();

    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  useEffect(() => {
    let isActive = true;

    async function loadReplyHunterData() {
      setIsLoadingReplyHunter(true);
      setReplyHunterError(null);

      try {
        const [targetsData, draftsData] = await Promise.all([
          api.getGrowthTargets(),
          api.getReplyDrafts(),
        ]);

        if (!isActive) {
          return;
        }

        setGrowthTargetsResponse(targetsData);
        setReplyDraftsResponse(draftsData);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setReplyHunterError(
          error instanceof Error ? error.message : 'Failed to load Reply Hunter.',
        );
      } finally {
        if (isActive) {
          setIsLoadingReplyHunter(false);
        }
      }
    }

    void loadReplyHunterData();

    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  async function refreshPosts(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoadingPosts(true);
    }

    try {
      const postsData = await api.getPosts();
      setPosts(postsData.items);
    } catch (error) {
      setQueueError(
        error instanceof Error ? error.message : 'Failed to refresh queue.',
      );
    } finally {
      if (!options?.silent) {
        setIsLoadingPosts(false);
      }
    }
  }

  async function refreshReplyHunterData(options?: { runWorker?: boolean }) {
    setIsLoadingReplyHunter(true);
    setReplyHunterError(null);

    try {
      if (options?.runWorker) {
        const result = await api.runReplyHunter();
        setReplyHunterMessage(
          result.created > 0
            ? `Reply Hunter added ${result.created} new reply draft${result.created === 1 ? '' : 's'}.`
            : 'Reply Hunter scanned the timeline and found no new targets that needed drafts.',
        );
      }

      const [targetsData, draftsData] = await Promise.all([
        api.getGrowthTargets(),
        api.getReplyDrafts(),
      ]);

      setGrowthTargetsResponse(targetsData);
      setReplyDraftsResponse(draftsData);
    } catch (error) {
      setReplyHunterError(
        error instanceof Error ? error.message : 'Failed to refresh Reply Hunter.',
      );
    } finally {
      setIsLoadingReplyHunter(false);
    }
  }

  function seedGenerator(topicValue: string) {
    setTopic(topicValue);
    setHookTopic(topicValue);
    setActiveView('command-center');
  }

  function syncTopicIdea(topicValue: string) {
    setTopic(topicValue);
    setHookTopic(topicValue);
  }

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGenerationError(null);

    const trimmedTopic = topic.trim();

    if (trimmedTopic.length < 4) {
      setGenerationError('Enter a longer topic so the generator has enough context.');
      return;
    }

    startTransition(() => {
      void api
        .generateContent({ topic: trimmedTopic })
        .then((content) => {
          setGeneratedContent(content);
        })
        .catch((error: unknown) => {
          setGenerationError(
            error instanceof Error
              ? error.message
              : 'Unable to generate content right now.',
          );
        });
    });
  }

  function handleGenerateHooks(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHookError(null);

    const trimmedTopic = hookTopic.trim();

    if (trimmedTopic.length < 4) {
      setHookError('Enter a longer topic so the hook generator has enough context.');
      return;
    }

    setIsGeneratingHooks(true);

    void api
      .generateHooks({ topic: trimmedTopic })
      .then((response) => {
        setHookIdeas(response);
      })
      .catch((error: unknown) => {
        setHookError(
          error instanceof Error ? error.message : 'Unable to generate hooks right now.',
        );
      })
      .finally(() => {
        setIsGeneratingHooks(false);
      });
  }

  function handleSaveDraft(input: { content: QueueContent; type: QueuePostType }) {
    setBusyAction(`save-${input.type}`);
    setQueueError(null);
    setQueueMessage(null);

    void api
      .saveDraft(input)
      .then(async ({ post }) => {
        await refreshPosts({ silent: true });
        setReloadCount((current) => current + 1);
        setQueueMessage(
          `${post.type === 'tweet' ? 'Tweet' : 'Thread'} saved to drafts.`,
        );
      })
      .catch((error: unknown) => {
        setQueueError(
          error instanceof Error ? error.message : 'Unable to save draft right now.',
        );
      })
      .finally(() => {
        setBusyAction(null);
      });
  }

  function handleSchedulePost(input: {
    content: QueueContent;
    type: QueuePostType;
    scheduledTime: string;
  }) {
    setBusyAction(`schedule-${input.type}`);
    setQueueError(null);
    setQueueMessage(null);

    try {
      const scheduledTime = normalizeLocalDateTime(input.scheduledTime);

      void api
        .schedulePost({
          content: input.content,
          type: input.type,
          scheduledTime,
        })
        .then(async ({ post }) => {
          await refreshPosts({ silent: true });
          setReloadCount((current) => current + 1);
          setQueueMessage(
            `${post.type === 'tweet' ? 'Tweet' : 'Thread'} scheduled for ${new Intl.DateTimeFormat(
              'en',
              {
                dateStyle: 'medium',
                timeStyle: 'short',
              },
            ).format(new Date(post.scheduledTime ?? scheduledTime))}.`,
          );
          setActiveView('queue-manager');
        })
        .catch((error: unknown) => {
          setQueueError(
            error instanceof Error ? error.message : 'Unable to schedule post right now.',
          );
        })
        .finally(() => {
          setBusyAction(null);
        });
    } catch (error) {
      setBusyAction(null);
      setQueueError(error instanceof Error ? error.message : 'Invalid schedule time.');
    }
  }

  function handleQueueSchedule(input: { postId: number; scheduledTime: string }) {
    setBusyAction(`schedule-post-${input.postId}`);
    setQueueError(null);
    setQueueMessage(null);

    try {
      const scheduledTime = normalizeLocalDateTime(input.scheduledTime);

      void api
        .schedulePost({
          postId: input.postId,
          scheduledTime,
        })
        .then(async ({ post }) => {
          await refreshPosts({ silent: true });
          setReloadCount((current) => current + 1);
          setQueueMessage(
            `Post #${post.id} is scheduled for ${new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(post.scheduledTime ?? scheduledTime))}.`,
          );
        })
        .catch((error: unknown) => {
          setQueueError(
            error instanceof Error ? error.message : 'Unable to update schedule right now.',
          );
        })
        .finally(() => {
          setBusyAction(null);
        });
    } catch (error) {
      setBusyAction(null);
      setQueueError(error instanceof Error ? error.message : 'Invalid schedule time.');
    }
  }

  function handleDeletePost(id: number) {
    setBusyAction(`delete-${id}`);
    setQueueError(null);
    setQueueMessage(null);

    void api
      .deletePost(id)
      .then(async () => {
        await refreshPosts({ silent: true });
        setReloadCount((current) => current + 1);
        setQueueMessage(`Post #${id} was deleted from the queue.`);
      })
      .catch((error: unknown) => {
        setQueueError(
          error instanceof Error ? error.message : 'Unable to delete the post right now.',
        );
      })
      .finally(() => {
        setBusyAction(null);
      });
  }

  function handleReplyDraftAction(
    id: number,
    status: 'approved' | 'rejected',
  ) {
    setReplyHunterBusyAction(`${status}-${id}`);
    setReplyHunterError(null);
    setReplyHunterMessage(null);

    void api
      .updateReplyDraftStatus(id, status)
      .then(async () => {
        await refreshReplyHunterData();
        setReplyHunterMessage(
          `Reply draft #${id} marked as ${status}.`,
        );
      })
      .catch((error: unknown) => {
        setReplyHunterError(
          error instanceof Error ? error.message : 'Unable to update reply draft right now.',
        );
      })
      .finally(() => {
        setReplyHunterBusyAction(null);
      });
  }

  const trendSignals = trendResponse?.items ?? dashboard?.trendSignals ?? [];
  const analyticsItems = analyticsResponse?.items ?? [];
  const bestPost = topPostsResponse?.items[0] ?? null;
  const totalPostImpressions = analyticsItems.reduce(
    (sum, post) => sum + post.impressions,
    0,
  );
  const totalPostEngagement = analyticsItems.reduce(
    (sum, post) => sum + post.totalEngagement,
    0,
  );
  const averagePostEngagementRate = analyticsItems.length
    ? Number(
        (
          analyticsItems.reduce((sum, post) => sum + post.engagementRate, 0) /
          analyticsItems.length
        ).toFixed(2),
      )
    : 0;
  const replyDrafts = replyDraftsResponse?.items ?? [];
  const pendingReplyDrafts = replyDrafts.filter((draft) => draft.status === 'draft').length;
  const growthTargetsCount = growthTargetsResponse?.items.length ?? 0;
  const draftCount = posts.filter((post) => post.status === 'draft').length;
  const scheduledCount = posts.filter((post) => post.status === 'scheduled').length;
  const postedCount = posts.filter((post) => post.status === 'posted').length;
  const publishedOnXCount = posts.filter((post) => Boolean(post.xPostId)).length;

  return (
    <main className="min-h-screen px-4 py-6 font-sans text-slate-100 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="space-y-3">
              <p className="subtle-label">AI Future Brief OS</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
                AI content production, discovery, replies, analytics, and scheduling system for @AIFutureBrief
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Discover fresh AI angles, generate content packs, hunt for viral reply opportunities, track post performance, save drafts, queue posts, and let the scheduler publish scheduled items to X automatically when they are due.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveView('command-center');
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  activeView === 'command-center'
                    ? 'bg-cyan-300 text-slate-950'
                    : 'border border-white/10 bg-white/4 text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-500/8'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Command Center
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('growth-lab');
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  activeView === 'growth-lab'
                    ? 'bg-cyan-300 text-slate-950'
                    : 'border border-white/10 bg-white/4 text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-500/8'
                }`}
              >
                <Compass className="h-4 w-4" />
                Growth Lab
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('reply-hunter');
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  activeView === 'reply-hunter'
                    ? 'bg-cyan-300 text-slate-950'
                    : 'border border-white/10 bg-white/4 text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-500/8'
                }`}
              >
                <MessageSquareQuote className="h-4 w-4" />
                Reply Hunter
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('analytics');
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  activeView === 'analytics'
                    ? 'bg-cyan-300 text-slate-950'
                    : 'border border-white/10 bg-white/4 text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-500/8'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('queue-manager');
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  activeView === 'queue-manager'
                    ? 'bg-cyan-300 text-slate-950'
                    : 'border border-white/10 bg-white/4 text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-500/8'
                }`}
              >
                <Rows3 className="h-4 w-4" />
                Queue Manager
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="panel p-5">
            <p className="text-sm text-slate-300">Drafts</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {draftCount}
            </p>
          </div>
          <div className="panel p-5">
            <p className="text-sm text-slate-300">Scheduled</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {scheduledCount}
            </p>
          </div>
          <div className="panel p-5">
            <p className="text-sm text-slate-300">Posted</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {postedCount}
            </p>
          </div>
          <div className="panel p-5">
            <p className="text-sm text-slate-300">Published on X</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {publishedOnXCount}
            </p>
          </div>
        </section>

        {loadError ? (
          <section className="rounded-[1.9rem] border border-rose-400/20 bg-rose-500/8 px-5 py-4 text-sm text-rose-100">
            {loadError}
          </section>
        ) : null}

        {activeView === 'queue-manager' ? (
          <QueueManager
            posts={posts}
            isLoading={isLoadingPosts}
            error={queueError}
            message={queueMessage}
            busyAction={busyAction}
            onRefresh={() => {
              void refreshPosts();
              setReloadCount((current) => current + 1);
            }}
            onDelete={handleDeletePost}
            onSchedule={handleQueueSchedule}
          />
        ) : activeView === 'growth-lab' ? (
          <GrowthLab
            topicsResponse={aiTopics}
            competitorsResponse={competitorRadar}
            hooksResponse={hookIdeas}
            hookTopic={hookTopic}
            isLoading={isLoadingGrowth}
            isGeneratingHooks={isGeneratingHooks}
            error={growthError}
            hookError={hookError}
            onHookTopicChange={setHookTopic}
            onGenerateHooks={handleGenerateHooks}
            onRefresh={() => {
              setReloadCount((current) => current + 1);
            }}
            onUseTopic={seedGenerator}
            onUseHook={seedGenerator}
            onUseCompetitorAngle={seedGenerator}
          />
        ) : activeView === 'reply-hunter' ? (
          <ReplyHunter
            targetsResponse={growthTargetsResponse}
            draftsResponse={replyDraftsResponse}
            isLoading={isLoadingReplyHunter}
            error={replyHunterError}
            busyAction={replyHunterBusyAction}
            message={replyHunterMessage}
            onRefresh={() => {
              void refreshReplyHunterData({ runWorker: true });
            }}
            onApprove={(id) => {
              handleReplyDraftAction(id, 'approved');
            }}
            onReject={(id) => {
              handleReplyDraftAction(id, 'rejected');
            }}
          />
        ) : activeView === 'analytics' ? (
          <AnalyticsDashboard
            analyticsResponse={analyticsResponse}
            topPostsResponse={topPostsResponse}
            dashboard={dashboard}
            isLoading={isLoadingAnalytics}
            error={analyticsError}
            onRefresh={() => {
              setReloadCount((current) => current + 1);
            }}
          />
        ) : (
          <>
            <section className="panel overflow-hidden">
              <div className="grid gap-8 p-6 md:grid-cols-[1.25fr_0.95fr] md:p-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/15 bg-cyan-500/6 px-4 py-2 text-sm text-cyan-100">
                    <span className="status-dot" />
                    AI Growth Agent online for @AIFutureBrief
                  </div>

                  <div className="space-y-4">
                    <p className="subtle-label">Social Command Center</p>
                    <div className="space-y-3">
                      <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
                        Turn one AI topic into a tweet, a thread, and then learn what performs while Reply Hunter expands your reach.
                      </h2>
                      <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                        Track account performance, discover fresh ideas in Growth Lab, generate high-signal X content, hunt for viral reply opportunities, measure the winners, and save everything into your production queue without leaving the app.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[
                      'Dashboard',
                      'Growth Lab',
                      'Reply Hunter',
                      'Analytics',
                      'Trend Scanner',
                      'Tweet Generator',
                      'Queue Manager',
                    ].map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-200"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 self-start md:grid-cols-2">
                  <div className="rounded-[1.8rem] border border-cyan-400/14 bg-cyan-500/7 p-5">
                    <p className="text-sm text-cyan-100">Next focus topic</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                      {deferredTopic}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-cyan-50/75">
                      Pull from Growth Lab or the trend scanner, then send it straight into the draft or schedule queue.
                    </p>
                  </div>

                  <div className="rounded-[1.8rem] border border-lime-400/14 bg-lime-500/7 p-5">
                    <p className="text-sm text-lime-100">Growth pulse</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                      {averagePostEngagementRate}% ER + {pendingReplyDrafts} reply drafts
                    </p>
                    <p className="mt-3 text-sm leading-6 text-lime-50/75">
                      {analyticsItems.length > 0
                        ? `${formatCompactNumber(totalPostEngagement)} total engagements and ${growthTargetsCount} live reply targets in play.`
                        : 'Publish a few posts and let Reply Hunter draft into live AI conversations to compound reach.'}
                    </p>
                  </div>

                  <div className="rounded-[1.8rem] border border-white/10 bg-white/4 p-5 md:col-span-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-300">Growth posture</p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          Use Growth Lab to find the angle, use Reply Hunter to join large AI conversations, then let analytics tell you which patterns deserve to repeat.
                        </p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-cyan-200" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Users className="h-6 w-6" />}
                label="Follower count"
                value={dashboard ? dashboard.followerCount.toLocaleString() : 'Loading...'}
                change={dashboard ? `+${dashboard.followerDelta}% this week` : 'Syncing'}
                hint="Audience growth across AI news, tools, and research coverage."
                tone="cyan"
              />
              <MetricCard
                icon={<Gauge className="h-6 w-6" />}
                label="Engagement rate"
                value={dashboard ? `${dashboard.engagementRate}%` : 'Loading...'}
                change={dashboard ? `${dashboard.avgLikes} avg likes/post` : 'Syncing'}
                hint="Healthy signal for clarity, opinion, and discussion depth."
                tone="lime"
              />
              <MetricCard
                icon={<BarChart3 className="h-6 w-6" />}
                label="Impressions"
                value={dashboard ? formatCompactNumber(dashboard.impressions) : 'Loading...'}
                change="Threads and replies are still the strongest reach drivers"
                hint="Rolling 7-day reach across posts, replies, and quote tweets."
                tone="amber"
              />
              <MetricCard
                icon={<Send className="h-6 w-6" />}
                label="Posts per day"
                value={dashboard ? `${dashboard.postsPerDay}` : 'Loading...'}
                change="Morning and afternoon windows are strongest"
                hint="Consistent cadence without flooding the feed."
                tone="rose"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
              <div className="space-y-6">
                <SectionCard
                  eyebrow="Growth Dashboard"
                  title="Follower momentum and impression velocity"
                  description="Watch the account compound attention across the week and spot when distribution is strongest."
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setReloadCount((current) => current + 1);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  }
                >
                  {isLoadingDashboard && !dashboard ? (
                    <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-12 text-center text-sm text-slate-300">
                      Syncing dashboard telemetry...
                    </div>
                  ) : (
                    <GrowthChart points={dashboard?.growthSeries ?? []} />
                  )}
                </SectionCard>

                <SectionCard
                  eyebrow="Trend Scanner"
                  title="Suggested AI topics from current news categories"
                  description="The backend returns five AI content opportunities spanning agents, open source, robotics, funding, and multimodal product shifts."
                >
                  <TrendScannerPanel
                    generatedAt={trendResponse?.generatedAt}
                    trends={trendSignals}
                    onUseTopic={(selectedTopic) => {
                      syncTopicIdea(selectedTopic);
                    }}
                  />
                </SectionCard>
              </div>

              <SectionCard
                eyebrow="AI Tweet Generator"
                title="Generate and queue a tweet pack from one topic"
                description="Click Generate Tweet to call the backend, then save the tweet or thread as a draft or schedule it directly into the queue."
              >
                <div className="space-y-6">
                  <div className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
                    <p className="text-sm leading-6 text-slate-300">
                      This generator returns one main tweet, a six-post thread, and three replies so you can move from idea to production-ready content in one pass.
                    </p>
                  </div>

                  {queueError ? (
                    <div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-100">
                      {queueError}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {topicPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          syncTopicIdea(preset);
                        }}
                        className="rounded-full border border-white/10 bg-white/4 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <form className="space-y-4" onSubmit={handleGenerate}>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-200">Topic</span>
                      <input
                        value={topic}
                        onChange={(event) => {
                          setTopic(event.target.value);
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35"
                        placeholder="Example: AI agents replacing SaaS"
                      />
                    </label>

                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      <Bot className="h-4 w-4" />
                      {isPending ? 'Generating...' : 'Generate Tweet'}
                    </button>
                  </form>

                  <GeneratedContentCard
                    key={generatedContent?.tweet ?? 'empty-generated-content'}
                    content={generatedContent}
                    isPending={isPending}
                    error={generationError}
                    focusTopic={deferredTopic}
                    busyAction={busyAction}
                    queueMessage={queueMessage}
                    onSaveDraft={handleSaveDraft}
                    onSchedulePost={handleSchedulePost}
                  />
                </div>
              </SectionCard>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <SectionCard
                  eyebrow="Scheduler"
                  title="Recommended posting windows"
                  description="Stage content for the highest-signal parts of the day and reserve late night slots for replies or experiments."
                >
                  <SchedulerPanel schedule={dashboard?.schedule ?? []} />
                </SectionCard>

                <SectionCard
                  eyebrow="Analytics Pulse"
                  title="What posted content is teaching the system"
                  description="This snapshot brings top-performing post data into the command center so future generation can adapt."
                >
                  {analyticsError ? (
                    <div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-100">
                      {analyticsError}
                    </div>
                  ) : isLoadingAnalytics && analyticsItems.length === 0 ? (
                    <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-10 text-center text-sm text-slate-300">
                      Loading analytics signals...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            Total impressions
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-white">
                            {formatCompactNumber(totalPostImpressions)}
                          </p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            Total engagement
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-white">
                            {formatCompactNumber(totalPostEngagement)}
                          </p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            Best engagement rate
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-white">
                            {bestPost ? `${bestPost.engagementRate}%` : '0%'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                              Top performing post
                            </p>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-100">
                              {previewContent(bestPost?.content)}
                            </p>
                          </div>
                          {bestPost ? (
                            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100 ring-1 ring-cyan-400/25">
                              {bestPost.engagementRate}% ER
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-4 text-sm text-slate-400">
                          {bestPost
                            ? 'Strong posts are combining clear hooks with concise takes and easier-to-share structure.'
                            : 'Once posts move through the scheduler, this panel will start surfacing what is working best.'}
                        </p>
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>

              <SectionCard
                eyebrow="Execution Notes"
                title="What is now fully connected"
                description="The app now spans discovery, replies, generation, analytics, persistence, scheduling, and real X publishing in one workflow."
              >
                <div className="grid gap-4">
                  <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
                    <div className="flex items-center gap-3">
                      <Compass className="h-5 w-5 text-cyan-200" />
                      <p className="text-base font-semibold text-white">Growth Lab</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Discovery endpoints feed ten AI topics, five viral hooks, and competitor radar targets directly into the generator workflow.
                    </p>
                  </article>

                  <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
                    <div className="flex items-center gap-3">
                      <MessageSquareQuote className="h-5 w-5 text-cyan-200" />
                      <p className="text-base font-semibold text-white">Reply Hunter</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Viral AI targets are scanned every 20 minutes and turned into reply drafts you can approve or reject from one review queue.
                    </p>
                  </article>

                  <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-cyan-200" />
                      <p className="text-base font-semibold text-white">Analytics engine</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Posted tweets and threads now feed analytics endpoints that rank top performers and show how engagement changes over time.
                    </p>
                  </article>

                  <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
                    <div className="flex items-center gap-3">
                      <Flame className="h-5 w-5 text-lime-200" />
                      <p className="text-base font-semibold text-white">Draft and schedule actions</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Generated tweets and threads can be saved as drafts or scheduled immediately from the result card.
                    </p>
                  </article>

                  <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
                    <div className="flex items-center gap-3">
                      <CalendarClock className="h-5 w-5 text-rose-200" />
                      <p className="text-base font-semibold text-white">Scheduler loop</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      The backend checks every minute for due items, enforces the 6-tweets-per-hour safety cap, and publishes to X when allowed.
                    </p>
                  </article>

                  <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-cyan-200" />
                      <p className="text-base font-semibold text-white">Queue manager</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Drafts, scheduled posts, posted items, X publication links, reply drafts, and engagement metrics all share one persistence layer so the app behaves like a lightweight AI editorial system.
                    </p>
                  </article>
                </div>
              </SectionCard>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default App;

