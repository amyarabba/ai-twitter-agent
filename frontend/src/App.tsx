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
  Radar,
  RefreshCw,
  Rows3,
  Send,
  Users,
} from 'lucide-react';

import { GeneratedContentCard } from './components/GeneratedContentCard';
import { GrowthChart } from './components/GrowthChart';
import { GrowthLab } from './components/growth/GrowthLab';
import { MetricCard } from './components/MetricCard';
import { SchedulerPanel } from './components/SchedulerPanel';
import { SectionCard } from './components/SectionCard';
import { TrendScannerPanel } from './components/TrendScannerPanel';
import { QueueManager } from './components/queue/QueueManager';
import { api } from './services/api';
import type {
  AiTopicsResponse,
  CompetitorRadarResponse,
  DashboardMetrics,
  GenerateContentResponse,
  QueueContent,
  QueuePost,
  QueuePostType,
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

function App() {
  const [activeView, setActiveView] = useState<
    'command-center' | 'queue-manager' | 'growth-lab'
  >('command-center');
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [trendResponse, setTrendResponse] = useState<TrendResponse | null>(null);
  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [aiTopics, setAiTopics] = useState<AiTopicsResponse | null>(null);
  const [competitorRadar, setCompetitorRadar] =
    useState<CompetitorRadarResponse | null>(null);
  const [topic, setTopic] = useState('AI agents replacing SaaS');
  const [hookTopic, setHookTopic] = useState('AI agents replacing SaaS');
  const [generatedContent, setGeneratedContent] =
    useState<GenerateContentResponse | null>(null);
  const [hookIdeas, setHookIdeas] = useState<ViralHooksResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [growthError, setGrowthError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [hookError, setHookError] = useState<string | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(true);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [busyAction, setBusyAction] = useState<string | null>(null);
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
          error instanceof Error
            ? error.message
            : 'Failed to load the Growth Lab.',
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

  const trendSignals = trendResponse?.items ?? dashboard?.trendSignals ?? [];
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
                AI content production, discovery, and scheduling system for @AIFutureBrief
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Discover fresh AI angles, generate content packs, save drafts, queue posts, and let the scheduler publish scheduled items to X automatically when they are due.
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
                  setActiveView('queue-manager');
                }}
