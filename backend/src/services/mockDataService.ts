import type {
  DashboardMetrics,
  GeneratePostResponse,
  GenerateTopicInput,
  ScheduleSlot,
  TrendTopic,
} from '../types/content.js';

const trendSignals: TrendTopic[] = [
  {
    id: 'agents-replacing-saas',
    title: 'AI agents replacing SaaS workflows',
    category: 'Agents',
    momentum: 'Exploding',
    angle: 'Why founders are shifting from dashboards to autonomous workflows that complete tasks end to end.',
    suggestedPost:
      'The next SaaS winner may look less like software you click and more like software that quietly finishes the work for you.',
  },
  {
    id: 'open-source-models',
    title: 'New open source models gaining serious traction',
    category: 'Open Source',
    momentum: 'Exploding',
    angle: 'Show how open models are lowering the cost of experimentation and speeding up product iteration.',
    suggestedPost:
      'Open source AI is no longer the budget option. It is becoming the fastest path to custom workflows and sharper product loops.',
  },
  {
    id: 'robotics-breakthroughs',
    title: 'Robotics breakthroughs moving from demo to deployment',
    category: 'Robotics',
    momentum: 'Rising',
    angle: 'Focus on how perception, planning, and cheaper hardware are making physical AI more commercially real.',
    suggestedPost:
      'The big robotics shift is not better demos. It is that more AI systems are starting to do useful work outside the lab.',
  },
  {
    id: 'startup-funding',
    title: 'AI startups funding is clustering around infrastructure and vertical tools',
    category: 'Funding',
    momentum: 'Rising',
    angle: 'Translate funding news into market signal: investors are backing workflow ownership, trust, and clear ROI.',
    suggestedPost:
      'Funding rounds tell you where investors think margins will live. In AI right now, that points to workflow control and product depth.',
  },
  {
    id: 'multimodal-ai',
    title: 'Multimodal AI is becoming the default product interface',
    category: 'Multimodal',
    momentum: 'Watchlist',
    angle: 'Explain why voice, image, and screen understanding together create stickier user experiences than chat alone.',
    suggestedPost:
      'Text chat was the first AI interface. Multimodal products are where the retention curve starts getting interesting.',
  },
];

const schedule: ScheduleSlot[] = [
  {
    label: 'Morning',
    time: '07:30',
    theme: 'Breaking AI news and sharp first takes',
    status: 'optimal',
  },
  {
    label: 'Afternoon',
    time: '13:15',
    theme: 'Tool roundups, market signal, and founder insight',
    status: 'optimal',
  },
  {
    label: 'Evening',
    time: '18:45',
    theme: 'Deeper thread unpacking a model, startup, or trend',
    status: 'watch',
  },
  {
    label: 'Late night',
    time: '22:30',
    theme: 'Replies, quote tweets, and experimental opinions',
    status: 'experimental',
  },
];

function trimTopic(topic: string): string {
  return topic.trim().replace(/\s+/g, ' ').slice(0, 70);
}

export function getTrendSignals(): TrendTopic[] {
  return trendSignals;
}

export function getDashboardMetrics(): DashboardMetrics {
  return {
    accountHandle: '@AIFutureBrief',
    followerCount: 18420,
    engagementRate: 6.4,
    impressions: 238400,
    postsPerDay: 6,
    followerDelta: 11.8,
    avgLikes: 612,
    responseWindow: '19 min',
    growthSeries: [
      { label: 'Mon', followers: 17120, impressions: 26800 },
      { label: 'Tue', followers: 17310, impressions: 31400 },
      { label: 'Wed', followers: 17620, impressions: 35200 },
      { label: 'Thu', followers: 17840, impressions: 38600 },
      { label: 'Fri', followers: 18090, impressions: 41200 },
      { label: 'Sat', followers: 18240, impressions: 37400 },
      { label: 'Sun', followers: 18420, impressions: 41800 },
    ],
    schedule,
    trendSignals,
  };
}

export function buildMockGeneration(input: GenerateTopicInput): GeneratePostResponse {
  const topic = trimTopic(input.topic);

  return {
    tweet:
      `${topic} is getting underestimated.\n\n` +
      'The real shift is not the headline. It is how much faster this makes small AI teams think, test, and ship.\n\n' +
      'When that happens, entire categories can move before incumbents realize the product surface has changed.',
    thread: [
      `Most people are looking at ${topic} as a feature story. It is actually a leverage story.`,
      `${topic} matters because it compresses the time between idea and usable output for teams building on AI.`,
      'That changes who can compete. Small teams get more shots on goal, and distribution starts to matter even more.',
      'The winners will not just have strong models. They will have sharp workflows, clear positioning, and a faster learning loop.',
      'This is why the smartest AI products now feel less like tools and more like tightly designed operating systems for one job.',
      `If ${topic} keeps improving, expect a wave of startups built around speed, trust, and workflow ownership.`,
    ],
    replies: [
      `Strong take. The overlooked part is how ${topic} changes distribution, not just raw capability. Faster workflows usually create the next breakout products.`,
      `${topic} feels important because it lowers the cost of experimentation. That is usually where category leaders start separating.`,
      `The market tends to focus on demos first. The better question is whether ${topic} changes how quickly teams can ship something users actually keep using.`,
    ],
  };
}
