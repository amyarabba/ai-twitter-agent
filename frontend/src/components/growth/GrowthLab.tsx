import { ArrowUpRight, Compass, Radar, RefreshCw, Search, Sparkles, Target } from 'lucide-react';
import type { FormEvent } from 'react';

import { SectionCard } from '../SectionCard';
import type {
  AiTopicsResponse,
  CompetitorRadarResponse,
  ViralHooksResponse,
} from '../../types';

interface GrowthLabProps {
  topicsResponse: AiTopicsResponse | null;
  competitorsResponse: CompetitorRadarResponse | null;
  hooksResponse: ViralHooksResponse | null;
  hookTopic: string;
  isLoading: boolean;
  isGeneratingHooks: boolean;
  error: string | null;
  hookError: string | null;
  onHookTopicChange: (value: string) => void;
  onGenerateHooks: (event: FormEvent<HTMLFormElement>) => void;
  onRefresh: () => void;
  onUseTopic: (topic: string) => void;
  onUseHook: (hook: string) => void;
  onUseCompetitorAngle: (angle: string) => void;
}

const competitorTypeClasses = {
  'Large AI account': 'bg-cyan-400/12 text-cyan-200 ring-cyan-400/25',
  'Viral discussion': 'bg-lime-400/12 text-lime-200 ring-lime-400/25',
  'Popular thread': 'bg-amber-400/12 text-amber-200 ring-amber-400/25',
} as const;

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

export function GrowthLab({
  topicsResponse,
  competitorsResponse,
  hooksResponse,
  hookTopic,
  isLoading,
  isGeneratingHooks,
  error,
  hookError,
  onHookTopicChange,
  onGenerateHooks,
  onRefresh,
  onUseTopic,
  onUseHook,
  onUseCompetitorAngle,
}: GrowthLabProps) {
  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[1.25fr_0.95fr] md:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/15 bg-cyan-500/6 px-4 py-2 text-sm text-cyan-100">
              <span className="status-dot" />
              Discovery engine active for @AIFutureBrief
            </div>

            <div className="space-y-3">
              <p className="subtle-label">Growth Lab</p>
              <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Build the next posting queue from live AI angles, sharp hooks, and high-signal engagement targets.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                The lab keeps fresh ideas flowing into the generator so you can move from discovery to draft without hunting for topics manually.
              </p>
            </div>
          </div>

          <div className="grid gap-4 self-start md:grid-cols-2">
            <div className="rounded-[1.8rem] border border-cyan-400/14 bg-cyan-500/7 p-5">
              <p className="text-sm text-cyan-100">Topics in rotation</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {topicsResponse?.items.length ?? 0}
              </p>
              <p className="mt-3 text-sm leading-6 text-cyan-50/75">
                Breakthroughs, models, startups, tools, robotics, and agent ideas ready to turn into content.
              </p>
            </div>

            <div className="rounded-[1.8rem] border border-lime-400/14 bg-lime-500/7 p-5">
              <p className="text-sm text-lime-100">Engagement targets</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {competitorsResponse?.items.length ?? 0}
              </p>
              <p className="mt-3 text-sm leading-6 text-lime-50/75">
                Suggested accounts, debates, and thread patterns to reply to or quote for reach.
              </p>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/4 p-5 md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-300">Refresh cycle</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    Topics refreshed {formatTimestamp(topicsResponse?.generatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/8"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh lab
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-[1.9rem] border border-rose-400/20 bg-rose-500/8 px-5 py-4 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          eyebrow="Trending AI Topics"
          title="Ten AI ideas ready for the content engine"
          description="Pick a topic and send it directly into the generator when you want to turn it into a tweet pack."
        >
          {isLoading && !topicsResponse ? (
            <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-12 text-center text-sm text-slate-300">
              Refreshing the AI topic stream...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {topicsResponse?.items.map((topic) => (
                <article
                  key={topic.id}
                  className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-200">
                      {topic.category}
                    </span>
                    <Compass className="h-5 w-5 text-cyan-200" />
                  </div>

                  <h3 className="mt-4 text-base font-semibold leading-6 text-white">
                    {topic.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{topic.insight}</p>

                  <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Suggested angle
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {topic.suggestedAngle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUseTopic(topic.title);
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/15"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Use in generator
                  </button>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Viral Hook Generator"
          title="Generate sharper lead tweets before you write the thread"
          description="Use one topic to create five opening angles, then feed the strongest one into the content generator."
        >
          <div className="space-y-5">
            <form className="space-y-4" onSubmit={onGenerateHooks}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Hook topic</span>
                <input
                  value={hookTopic}
                  onChange={(event) => {
                    onHookTopicChange(event.target.value);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35"
                  placeholder="Example: AI agents replacing SaaS"
                />
              </label>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingHooks ? 'Generating hooks...' : 'Generate hooks'}
              </button>
            </form>

            {hookError ? (
              <div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-100">
                {hookError}
              </div>
            ) : null}

            {isGeneratingHooks ? (
              <div className="rounded-[1.6rem] border border-cyan-400/15 bg-cyan-500/5 p-5 text-sm text-cyan-100">
                Building new hook options for {hookTopic}...
              </div>
            ) : hooksResponse ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
                  <span>Generated {formatTimestamp(hooksResponse.generatedAt)}</span>
                  <span className="inline-flex items-center gap-2 text-cyan-200">
                    <Search className="h-4 w-4" />
                    5 hooks ready
                  </span>
                </div>

                <div className="grid gap-3">
                  {hooksResponse.hooks.map((hook, index) => (
                    <article
                      key={`${index + 1}-${hook.slice(0, 24)}`}
                      className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          Hook {index + 1}
                        </p>
                        <Target className="h-4 w-4 text-cyan-200" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-100">{hook}</p>
                      <button
                        type="button"
                        onClick={() => {
                          onUseHook(hook);
                        }}
                        className="mt-4 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/15"
                      >
                        Use hook in generator
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
                Enter a topic and the system will generate five opening angles built for sharper scroll-stopping tweets.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        eyebrow="Competitor Radar"
        title="Suggested engagement targets worth replying to or quoting"
        description="Use these targets to create conversation starters that pull your account into larger AI timelines."
      >
        {isLoading && !competitorsResponse ? (
          <div className="rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-12 text-center text-sm text-slate-300">
            Scanning competitor and discussion patterns...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {competitorsResponse?.items.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${competitorTypeClasses[item.type]}`}
                  >
                    {item.type}
                  </span>
                  <Radar className="h-4 w-4 text-cyan-200" />
                </div>

                <h3 className="mt-4 text-base font-semibold text-white">{item.label}</h3>
                {item.handle ? (
                  <p className="mt-1 text-sm text-cyan-100">{item.handle}</p>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.reason}</p>

                <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Engagement angle
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{item.angle}</p>
                </div>

                <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
                  Best audience
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.audience}</p>

                <button
                  type="button"
                  onClick={() => {
                    onUseCompetitorAngle(item.angle);
                  }}
                  className="mt-4 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/15"
                >
                  Use angle in generator
                </button>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
