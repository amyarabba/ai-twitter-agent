import { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
  Rocket,
  Trash2,
} from 'lucide-react';

import { SectionCard } from '../SectionCard';
import type { QueuePost } from '../../types';

interface QueueManagerProps {
  posts: QueuePost[];
  isLoading: boolean;
  error: string | null;
  message: string | null;
  busyAction: string | null;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  onSchedule: (input: { postId: number; scheduledTime: string }) => void;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toLocalDateTime(value: string | null, fallbackHours: number): string {
  const date = value
    ? new Date(value)
    : new Date(Date.now() + fallbackHours * 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function renderContent(content: QueuePost['content']) {
  if (Array.isArray(content)) {
    return (
      <div className="space-y-3">
        {content.map((item, index) => (
          <article
            key={`${index + 1}-${item.slice(0, 18)}`}
            className="rounded-2xl border border-white/8 bg-slate-950/50 p-3"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Tweet {index + 1}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-200">
              {item}
            </p>
          </article>
        ))}
      </div>
    );
  }

  return <p className="whitespace-pre-line text-sm leading-6 text-slate-200">{content}</p>;
}

function QueuePostCard({
  post,
  busyAction,
  onDelete,
  onSchedule,
}: {
  post: QueuePost;
  busyAction: string | null;
  onDelete: (id: number) => void;
  onSchedule: (input: { postId: number; scheduledTime: string }) => void;
}) {
  const [scheduleTime, setScheduleTime] = useState(
    toLocalDateTime(post.scheduledTime, post.status === 'draft' ? 2 : 1),
  );

  const statusClasses = {
    draft: 'bg-white/6 text-slate-200 ring-white/10',
    scheduled: 'bg-cyan-500/10 text-cyan-100 ring-cyan-400/25',
    posted: 'bg-lime-500/10 text-lime-100 ring-lime-400/25',
  } as const;

  return (
    <article className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-200">
              {post.type}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClasses[post.status]}`}
            >
              {post.status}
            </span>
            {post.xPostId ? (
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100 ring-1 ring-cyan-400/25">
                Published on X
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-400">Created {formatDateTime(post.createdAt)}</p>
          {post.scheduledTime ? (
            <p className="text-sm text-slate-400">
              Scheduled for {formatDateTime(post.scheduledTime)}
            </p>
          ) : null}
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

      <div className="mt-4">{renderContent(post.content)}</div>

      {post.status === 'posted' && post.engagement ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Impressions</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {post.engagement.impressions.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Likes</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {post.engagement.likes.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Replies</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {post.engagement.replies.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Retweets</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {post.engagement.retweets.toLocaleString()}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        {post.status !== 'posted' ? (
          <label className="flex-1 space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {post.status === 'draft' ? 'Schedule post' : 'Reschedule post'}
            </span>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(event) => {
                setScheduleTime(event.target.value);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
            />
          </label>
        ) : post.xPostId ? (
          <div className="flex items-center gap-2 text-sm text-cyan-100">
            <Rocket className="h-4 w-4" />
            Live on X and tracked in the queue
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-lime-100">
            <CheckCircle2 className="h-4 w-4" />
            Posted and logged by the scheduler
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {post.status !== 'posted' ? (
            <button
              type="button"
              onClick={() => {
                onSchedule({ postId: post.id, scheduledTime: scheduleTime });
              }}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CalendarClock className="h-4 w-4" />
              {post.status === 'draft' ? 'Schedule' : 'Reschedule'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              onDelete(post.id);
            }}
            disabled={busyAction !== null}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/8 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/14 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export function QueueManager({
  posts,
  isLoading,
  error,
  message,
  busyAction,
  onRefresh,
  onDelete,
  onSchedule,
}: QueueManagerProps) {
  const groupedPosts = {
    drafts: posts.filter((post) => post.status === 'draft'),
    scheduled: posts.filter((post) => post.status === 'scheduled'),
    posted: posts.filter((post) => post.status === 'posted'),
    publishedOnX: posts.filter((post) => Boolean(post.xPostId)),
  };

  const sections = [
    {
      key: 'drafts',
      title: 'Drafts',
      description: 'Raw ideas waiting for a publish window.',
      icon: <Clock3 className="h-4 w-4" />,
      items: groupedPosts.drafts,
    },
    {
      key: 'scheduled',
      title: 'Scheduled posts',
      description: 'Queued items the scheduler will publish automatically.',
      icon: <CalendarClock className="h-4 w-4" />,
      items: groupedPosts.scheduled,
    },
    {
      key: 'posted',
      title: 'Posted posts',
      description: 'Posts already moved through the scheduler.',
      icon: <CheckCircle2 className="h-4 w-4" />,
      items: groupedPosts.posted,
    },
  ] as const;

  const summaryCards = [
    {
      key: 'drafts',
      title: 'Draft',
      count: groupedPosts.drafts.length,
      icon: <Clock3 className="h-4 w-4" />,
    },
    {
      key: 'scheduled',
      title: 'Scheduled',
      count: groupedPosts.scheduled.length,
      icon: <CalendarClock className="h-4 w-4" />,
    },
    {
      key: 'posted',
      title: 'Posted',
      count: groupedPosts.posted.length,
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      key: 'published',
      title: 'Published on X',
      count: groupedPosts.publishedOnX.length,
      icon: <Rocket className="h-4 w-4" />,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Queue Manager"
        title="Draft, schedule, publish, and monitor the posting pipeline"
        description="This page turns the generator into a content production system. Save drafts, queue them for a time slot, and let the scheduler publish them to X automatically when they are due."
        action={
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh queue
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.key}
              className="rounded-[1.55rem] border border-white/8 bg-white/4 p-5"
            >
              <div className="flex items-center gap-2 text-slate-200">
                {card.icon}
                <p className="text-sm font-medium">{card.title}</p>
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {card.count}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {message ? (
        <div className="rounded-[1.4rem] border border-lime-400/20 bg-lime-500/8 px-4 py-3 text-sm text-lime-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {sections.map((section) => (
        <SectionCard
          key={section.key}
          eyebrow="Queue"
          title={section.title}
          description={section.description}
        >
          {isLoading ? (
            <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-10 text-center text-sm text-slate-300">
              Loading queue data...
            </div>
          ) : section.items.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
              No {section.title.toLowerCase()} yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {section.items.map((post: QueuePost) => (
                <QueuePostCard
                  key={post.id}
                  post={post}
                  busyAction={busyAction}
                  onDelete={onDelete}
                  onSchedule={onSchedule}
                />
              ))}
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  );
}
