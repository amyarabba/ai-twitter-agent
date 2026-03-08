import { useState } from 'react';
import { CalendarClock, Save, SendHorizontal, Sparkles } from 'lucide-react';

import type {
  GenerateContentResponse,
  QueueContent,
  QueuePostType,
} from '../types';

interface GeneratedContentCardProps {
  content: GenerateContentResponse | null;
  isPending: boolean;
  error: string | null;
  focusTopic: string;
  busyAction: string | null;
  queueMessage: string | null;
  onSaveDraft: (input: { content: QueueContent; type: QueuePostType }) => void;
  onSchedulePost: (input: {
    content: QueueContent;
    type: QueuePostType;
    scheduledTime: string;
  }) => void;
}

function makeLocalDateTime(hoursFromNow: number): string {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function ActionRow({
  type,
  scheduleTime,
  onScheduleTimeChange,
  onSaveDraft,
  onSchedulePost,
  isBusy,
}: {
  type: QueuePostType;
  scheduleTime: string;
  onScheduleTimeChange: (value: string) => void;
  onSaveDraft: () => void;
  onSchedulePost: () => void;
  isBusy: boolean;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-500/8 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex-1 space-y-2">
          <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Schedule {type}
          </span>
          <input
            type="datetime-local"
            value={scheduleTime}
            onChange={(event) => {
              onScheduleTimeChange(event.target.value);
            }}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
          />
        </label>

        <button
          type="button"
          onClick={onSchedulePost}
          disabled={isBusy || !scheduleTime}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
        >
          <CalendarClock className="h-4 w-4" />
          Schedule Post
        </button>
      </div>
    </div>
  );
}

export function GeneratedContentCard({
  content,
  isPending,
  error,
  focusTopic,
  busyAction,
  queueMessage,
  onSaveDraft,
  onSchedulePost,
}: GeneratedContentCardProps) {
  const [tweetScheduleTime, setTweetScheduleTime] = useState(makeLocalDateTime(2));
  const [threadScheduleTime, setThreadScheduleTime] = useState(makeLocalDateTime(6));


  if (error) {
    return (
      <div className="rounded-[1.6rem] border border-rose-400/20 bg-rose-500/8 p-5 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="rounded-[1.6rem] border border-cyan-400/15 bg-cyan-500/5 p-5">
        <div className="flex items-center gap-3 text-cyan-100">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <p className="text-sm">Generating a fresh tweet pack for {focusTopic}...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
        Enter an AI topic and the system will return one viral tweet, a six-post thread, and three reply ideas you can use immediately.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {queueMessage ? (
        <div className="rounded-[1.4rem] border border-lime-400/20 bg-lime-500/8 px-4 py-3 text-sm text-lime-100">
          {queueMessage}
        </div>
      ) : null}

      <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Generated content pack
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
              1 tweet, 6 thread posts, 3 replies for {focusTopic}
            </h3>
          </div>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
            Production ready
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Tweet</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-100">
            {content.tweet}
          </p>
          <ActionRow
            type="tweet"
            scheduleTime={tweetScheduleTime}
            onScheduleTimeChange={setTweetScheduleTime}
            onSaveDraft={() => {
              onSaveDraft({ content: content.tweet, type: 'tweet' });
            }}
            onSchedulePost={() => {
              onSchedulePost({
                content: content.tweet,
                type: 'tweet',
                scheduledTime: tweetScheduleTime,
              });
            }}
            isBusy={busyAction !== null}
          />
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Thread</p>
            <span className="inline-flex items-center gap-2 text-xs text-slate-400">
              <SendHorizontal className="h-3.5 w-3.5" />
              6 post sequence
            </span>
          </div>
          {content.thread.map((tweet, index) => (
            <article
              key={`${index + 1}-${tweet.slice(0, 18)}`}
              className="rounded-2xl border border-white/8 bg-white/3 p-4"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Tweet {index + 1}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-100">
                {tweet}
              </p>
            </article>
          ))}
          <ActionRow
            type="thread"
            scheduleTime={threadScheduleTime}
            onScheduleTimeChange={setThreadScheduleTime}
            onSaveDraft={() => {
              onSaveDraft({ content: content.thread, type: 'thread' });
            }}
            onSchedulePost={() => {
              onSchedulePost({
                content: content.thread,
                type: 'thread',
                scheduledTime: threadScheduleTime,
              });
            }}
            isBusy={busyAction !== null}
          />
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-white/8 bg-white/3 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Reply suggestions
        </p>
        <div className="mt-4 grid gap-3">
          {content.replies.map((reply, index) => (
            <article
              key={`${index + 1}-${reply.slice(0, 18)}`}
              className="rounded-2xl border border-white/8 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Reply {index + 1}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-200">{reply}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

