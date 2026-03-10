import OpenAI from 'openai';
import { z } from 'zod';

import { env } from '../config/env.js';
import { getTrendSignals } from './mockDataService.js';

import type {
  GrowthReplyInput,
  GrowthReplyResponse,
  GrowthTarget,
  GrowthTargetsResponse,
} from '../types/content.js';

const SEARCH_URL = 'https://api.x.com/2/tweets/search/recent';

const client = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

const replySchema = z.object({
  reply_text: z.string().trim().min(20).max(220),
});

const fallbackAuthors = [
  '@rowancheung',
  '@swyx',
  '@OpenAI',
  '@AnthropicAI',
  '@bentossell',
  '@aidan_mclau',
  '@nearcyan',
  '@TechCrunch',
] as const;

function cleanText(text: string): string {
  return text
    .replace(/#[A-Za-z0-9_]+/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function buildTargetText(topic: string, angle: string, index: number): string {
  const variants = [
    `${topic} is moving faster than most people realize. ${angle}`,
    `Hot take: ${topic} is less about flashy demos and more about workflow control. ${angle}`,
    `${topic} is starting to shift how AI products get built and distributed. ${angle}`,
    `People keep treating ${topic} like a niche story. The market signal is much bigger. ${angle}`,
  ];

  return cleanText(variants[index % variants.length] ?? variants[0] ?? topic).slice(0, 278);
}

function buildFallbackTargets(): GrowthTarget[] {
  const trendSignals = getTrendSignals();
  const generatedAt = Date.now();

  return trendSignals.flatMap((signal, index) => {
    const baseSeed = `${signal.id}:${signal.title}:${signal.angle}`;
    const textA = buildTargetText(signal.title, signal.angle, index);
    const textB = buildTargetText(signal.title, signal.suggestedPost, index + 1);

    return [textA, textB].map((text, variantIndex) => {
      const seed = hashString(`${baseSeed}:${variantIndex}`);
      const offsetMinutes = index * 57 + variantIndex * 19 + 12;

      return {
        tweetId: `sim-${signal.id}-${variantIndex + 1}`,
        author: fallbackAuthors[(index + variantIndex) % fallbackAuthors.length] ?? '@AIFutureBrief',
        text,
        likes: 1200 + (seed % 5400),
        reposts: 120 + ((seed >>> 3) % 940),
        replies: 36 + ((seed >>> 7) % 320),
        createdAt: new Date(generatedAt - offsetMinutes * 60 * 1000).toISOString(),
      };
    });
  });
}

function buildFallbackReply(input: GrowthReplyInput): GrowthReplyResponse {
  const normalizedTweet = cleanText(input.tweetText);
  const lowercaseTweet = normalizedTweet.toLowerCase();

  let reply =
    'The part people are missing is that distribution usually changes before the product category fully re-prices. Curious which workflow you think breaks first.';

  if (lowercaseTweet.includes('agents')) {
    reply =
      'The interesting part is that agents do not need to replace all software to pressure SaaS margins. Owning the workflow is enough. What part feels most defensible to you?';
  } else if (lowercaseTweet.includes('open source')) {
    reply =
      'Open source is getting underestimated because it changes iteration speed, not just cost. The teams learning fastest may matter more than the benchmark winners.';
  } else if (lowercaseTweet.includes('robot')) {
    reply =
      'What makes this more interesting now is that robotics progress is starting to look operational instead of theatrical. The deployment numbers are the real story.';
  } else if (lowercaseTweet.includes('model')) {
    reply =
      'The benchmark headline matters less than what this unlocks for product teams shipping under real latency and cost constraints. That is where the market gets decided.';
  }

  return {
    replyText: cleanText(reply).slice(0, 220),
  };
}

function buildReplyPrompt(input: GrowthReplyInput): string {
  return [
    'Generate a high-quality reply for the X account @AIFutureBrief responding to an AI-related viral tweet.',
    'Tone requirements: adds value, sounds human, short, encourages conversation, clear for a tech audience.',
    'Return JSON only with this exact shape:',
    '{"reply_text":"string"}',
    'Rules:',
'- The reply must add a useful insight or question, not generic praise.',
'- Avoid generic replies like "Great insight".',
'- Write like a thoughtful AI engineer commenting on the topic.',
'- Occasionally ask a thoughtful question.',
'- Keep it concise and natural.',
'- Do not use hashtags.',
'- Do not sound salesy or promotional.',
'- Stay under 220 characters.',
`Author: ${input.author}`,
`Original tweet: ${input.tweetText}`,
].join('\n');
}

export async function getGrowthTargets(): Promise<GrowthTargetsResponse> {

const query = encodeURIComponent(
    'AI OR "AI agents" OR OpenAI OR Anthropic OR robotics lang:en -is:retweet'
);

const url =
  `${SEARCH_URL}?query=${query}&max_results=20&tweet.fields=public_metrics,created_at`;

const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${env.X_OAUTH2_ACCESS_TOKEN}`,
  },
});

if (!response.ok) {
  console.log('X API unavailable, using fallback AI signals.');
  return {
    generatedAt: new Date().toISOString(),
    items: buildFallbackTargets()
      .sort((left, right) => right.likes - left.likes)
      .slice(0, 8),
  };
}

const data = await response.json();

const items = (data.data || []).map((tweet: any) => ({
  tweetId: tweet.id,
  author: '@unknown',
  text: tweet.text,
  likes: tweet.public_metrics?.like_count || 0,
  reposts: tweet.public_metrics?.retweet_count || 0,
  replies: tweet.public_metrics?.reply_count || 0,
  createdAt: tweet.created_at,
}));

return {
  generatedAt: new Date().toISOString(),
  items: items
    .filter(
      (t: any) =>
        t.likes + t.reposts + t.replies > 50
    )
    .sort(
      (a: any, b: any) =>
        b.likes + b.reposts + b.replies -
        (a.likes + a.reposts + a.replies)
    )
    .slice(0, 8),
};

}

export async function generateGrowthReply(
  input: GrowthReplyInput,
): Promise<GrowthReplyResponse> {
  if (!client) {
    return buildFallbackReply(input);
  }

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: buildReplyPrompt(input),
      text: {
        format: {
          type: 'json_object',
        },
      },
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      throw new Error('The OpenAI API returned an empty reply response.');
    }

    const parsed = replySchema.parse(JSON.parse(rawOutput) as { reply_text: string });

    return {
      replyText: cleanText(parsed.reply_text),
    };
  } catch (error) {
    console.error('Reply generation failed, falling back to local reply logic.', error);
    return buildFallbackReply(input);
  }
}

