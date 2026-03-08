import { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  MessageSquareQuote,
  RefreshCw,
  Search,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';

import { SectionCard } from '../SectionCard';
import type {
  GrowthTargetsResponse,
  ReplyDraftStatus,
  ReplyDraftsResponse,
} from '../../types';

interface ReplyHunterProps {
  targetsResponse: GrowthTargetsResponse | null;
  draftsResponse: ReplyDraftsResponse | null;
  isLoading: boolean;
  error: string | null;
  busyAction: string | null;
  message: string | null;
  onRefresh: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatTimestamp(value?: string | null): string {
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

function previewText(value: string, limit = 220): string {
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}

function isLiveTweetId(tweetId: string): boolean {
  return /^\d+$/.test(tweetId);
}

const filterOptions: Array<{ label: string; value: 'all' | ReplyDraftStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Approved', value: 'approved' },
  { label: 'Posted', value: 'posted' },
  { label: 'Rejected', value: 'rejected' },
];

export function ReplyHunter({
  targetsResponse,
  draftsResponse,
  isLoading,
  error,
  busyAction,
  message,
  onRefresh,
  onApprove,
  onReject,
}: ReplyHunterProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | ReplyDraftStatus>('all');
  const targets = targetsResponse?.items ?? [];
  const drafts = draftsResponse?.items ?? [];
  const draftByTweetId = new Map(drafts.map((draft) => [draft.tweetId, draft]));
  const draftCount = drafts.filter((draft) => draft.status === 'draft').length;
  const approvedCount = drafts.filter((draft) => draft.status === 'approved').length;
  const postedCount = drafts.filter((draft) => draft.status === 'posted').length;
  const rejectedCount = drafts.filter((draft) => draft.status === 'rejected').length;
  const filteredDrafts =
    statusFilter === 'all'
      ? drafts
      : drafts.filter((draft) => draft.status === statusFilter);

  const statusClasses: Record<ReplyDraftStatus, string> = {
    draft: 'bg-cyan-500/10 text-cyan-100 ring-cyan-400/25',
    approved: 'bg-lime-500/10 text-lime-100 ring-lime-400/25',
    posted: 'bg-amber-500/10 text-amber-100 ring-amber-400/25',
    rejected: 'bg-rose-500/10 text-rose-100 ring-rose-400/25',
  };

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/15 bg-cyan-500/6 px-4 py-2 text-sm text-cyan-100">
              <span className="status-dot" />
              Reply Hunter active for @AIFutureBrief
            </div>

            <div className="space-y-3">
              <p className="subtle-label">Reply Hunter</p>
              <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Find hot AI conversations, approve the sharpest replies, and let the publisher close the loop automatically.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                The worker scans AI targets every 20 minutes, drafts concise replies, and the reply publisher checks approved replies every 10 minutes for automatic posting.
              </p>
            </div>
          </div>

          <div className="grid gap-4 self-start md:grid-cols-2">
            <div className="rounded-[1.8rem] border border-cyan-400/14 bg-cyan-500/7 p-5">
              <p className="text-sm text-cyan-100">Active targets</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {targets.length}
              </p>
              <p className="mt-3 text-sm leading-6 text-cyan-50/75">
                Viral AI tweets currently worth replying to.
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-cyan-400/14 bg-cyan-500/7 p-5">
              <p className="text-sm text-cyan-100">Draft replies</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {draftCount}
              </p>
              <p className="mt-3 text-sm leading-6 text-cyan-50/75">
                New replies waiting for human review.
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-lime-400/14 bg-lime-500/7 p-5">
              <p className="text-sm text-lime-100">Approved queue</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {approvedCount}
              </p>
              <p className="mt-3 text-sm leading-6 text-lime-50/75">
                Replies queued for automatic publishing.
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-amber-400/14 bg-amber-500/7 p-5">
              <p className="text-sm text-amber-100">Posted replies</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {postedCount}
              </p>
              <p className="mt-3 text-sm leading-6 text-amber-50/75">
                Approved replies already published on X.
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/4 p-5 md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-300">Last scan</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatTimestamp(targetsResponse?.generatedAt)}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {approvedCount} approved, {postedCount} posted, {rejectedCount} rejected.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
                >
                  <RefreshCw className="h-4 w-4" />
                  Run Reply Hunter
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          eyebrow="Growth Targets"
          title="Viral AI tweets worth engaging"
          description="These are the conversations the system believes can create useful reach if @AIFutureBrief replies with a sharp, value-adding take."
        >
          {isLoading && targets.length === 0 ? (
            <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-12 text-center text-sm text-slate-300">
              Scanning the AI timeline for strong reply targets...
            </div>
          ) : (
            <div className="grid gap-4">
              {targets.map((target) => {
                const draft = draftByTweetId.get(target.tweetId);
                const targetIsLive = isLiveTweetId(target.tweetId);

                return (
                  <article
                    key={target.tweetId}
                    className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-200">
                            {target.author}
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-200">
                            {formatTimestamp(target.createdAt)}
                          </span>
                          {draft ? (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClasses[draft.status]}`}
                            >
                              Reply {draft.status}
                            </span>
                          ) : null}
                        </div>
                        <p className="max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-100">
                          {target.text}
                        </p>
                      </div>

                      {targetIsLive ? (
                        <a
                          href={`https://x.com/i/web/status/${target.tweetId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View target
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                          <ExternalLink className="h-4 w-4" />
                          Simulated target
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Likes</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactNumber(target.likes)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Reposts</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactNumber(target.reposts)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Replies</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactNumber(target.replies)}
                        </p>
                      </div>
                    </div>

                    {draft ? (
                      <div className="mt-4 rounded-2xl border border-cyan-300/14 bg-cyan-500/6 p-4">
                        <div className="flex items-center gap-2 text-cyan-100">
                          <Bot className="h-4 w-4" />
                          <p className="text-sm font-medium">Current draft</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-100">
                          {draft.replyText}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Reply Drafts"
          title="Review, approve, and monitor reply publishing"
          description="Approve the strongest replies, filter the queue by status, and track which ones have already been posted to X."
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const isActive = statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option.value);
                    }}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      isActive
                        ? 'bg-cyan-300 text-slate-950'
                        : 'border border-white/10 bg-white/4 text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-500/8'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {isLoading && drafts.length === 0 ? (
              <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-12 text-center text-sm text-slate-300">
                Waiting for the reply draft queue...
              </div>
            ) : drafts.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
                No reply drafts yet. Run Reply Hunter and the worker will generate fresh reply drafts for the strongest targets.
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
                No reply drafts match the <span className="font-medium text-white">{statusFilter}</span> filter right now.
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDrafts.map((draft) => {
                  const canApprove = draft.status !== 'approved' && draft.status !== 'posted';
                  const canReject = draft.status !== 'rejected' && draft.status !== 'posted';
                  const targetIsLive = isLiveTweetId(draft.tweetId);

                  return (
                    <article
                      key={draft.id}
                      className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-200">
                              Target {draft.tweetId}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ${statusClasses[draft.status]}`}
                            >
                              {draft.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">
                            Drafted {formatTimestamp(draft.createdAt)}
                            {draft.postedAt ? ` | Posted ${formatTimestamp(draft.postedAt)}` : ''}
                          </p>
                        </div>
                        <MessageSquareQuote className="h-5 w-5 text-cyan-200" />
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          Original tweet
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {previewText(draft.tweetText, 260)}
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl border border-cyan-300/14 bg-cyan-500/6 p-4">
                        <div className="flex items-center gap-2 text-cyan-100">
                          <Search className="h-4 w-4" />
                          <p className="text-sm font-medium">Generated reply</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-100">
                          {draft.replyText}
                        </p>
                      </div>

                      {draft.status === 'approved' && !targetIsLive ? (
                        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/8 p-4 text-sm leading-6 text-amber-100">
                          This reply is approved, but the target is simulated. Auto-posting only works for live X tweet IDs.
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            onApprove(draft.id);
                          }}
                          disabled={!canApprove || busyAction !== null}
                          className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onReject(draft.id);
                          }}
                          disabled={!canReject || busyAction !== null}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/8 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/14 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Reject
                        </button>
                        {draft.replyPostId ? (
                          <a
                            href={`https://x.com/i/web/status/${draft.replyPostId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View on X
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        eyebrow="How It Works"
        title="Reply Hunter workflow"
        description="This module is built to extend reach by joining AI conversations that already have attention."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-cyan-200" />
              <p className="text-base font-semibold text-white">Target scan</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The system surfaces AI tweets with strong engagement potential so reply effort is spent where distribution is already active.
            </p>
          </article>

          <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="h-5 w-5 text-lime-200" />
              <p className="text-base font-semibold text-white">Reply drafting</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Each reply is designed to add value, sound human, and pull the conversation forward instead of sounding generic.
            </p>
          </article>

          <article className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-200" />
              <p className="text-base font-semibold text-white">Approval to publish</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Approved replies become publish candidates, and the reply publisher checks every 10 minutes to post live-target replies automatically.
            </p>
          </article>
        </div>
      </SectionCard>
    </div>
  );
}

