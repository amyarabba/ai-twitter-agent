import OpenAI from 'openai';
import { z } from 'zod';

import { env } from '../config/env.js';
import { getAnalyticsInsights } from './analyticsInsightsService.js';
import {
  buildMockGeneration,
  buildOptimizedMockGeneration,
} from './mockDataService.js';
import type {
  AnalyticsInsightsResponse,
  GeneratePostResponse,
  GenerateTopicInput,
} from '../types/content.js';

const outputSchema = z.object({
  tweet: z.string().trim().min(40).max(280),
  thread: z.array(z.string().trim().min(20).max(280)).length(6),
  replies: z.array(z.string().trim().min(20).max(220)).length(3),
});

const client = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

function cleanPost(text: string, limit = 280): string {
  const cleaned = text
    .replace(/#[A-Za-z0-9_]+/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (cleaned.length > limit) {
    return cleaned.slice(0, limit - 1).trim();
  }

  return cleaned;
}
function sanitizeResponse(content: GeneratePostResponse): GeneratePostResponse {
  return {
    tweet: cleanPost(content.tweet, 280),
    thread: content.thread.slice(0, 6).map((tweet) => cleanPost(tweet, 280)),
    replies: content.replies.slice(0, 3).map((reply) => cleanPost(reply, 220)),
  };
}
function makePrompt(input: GenerateTopicInput): string {
  return [
    'Generate high-quality posts for the X account @AIFutureBrief that cover AI breakthroughs, tools, research, and AI industry developments.',
    'Tone requirements: insightful, slightly provocative, concise, clear for a tech audience.',
    'Return JSON only using this exact shape:',
    '{"tweet":"string","thread":["tweet1","tweet2","tweet3","tweet4","tweet5","tweet6"],"replies":["reply1","reply2","reply3"]}',
    'Rules:',
    '- The single tweet should feel post-worthy on its own and stay under 280 characters.',
    '- The thread must contain exactly 6 tweets.',
    '- The first thread tweet must be a strong hook.',
    '- Make every thread tweet easy to read.',
    '- Do not use hashtags anywhere in the output.',
    '- The three replies should sound natural on large AI posts.',
    `Topic: ${input.topic}`,
  ].join('\n');
}

function buildInsightsPrompt(insights: AnalyticsInsightsResponse): string {
  const topicLines = insights.bestPerformingTopics
    .slice(0, 3)
    .map(
      (item, index) =>
        `${index + 1}. ${item.topic} | avg engagement ${item.avgEngagement}% | best hook ${item.bestHookStyle} | best time ${item.bestPostTime}`,
    )
    .join('\n');
  const hookLines = insights.bestPerformingHookStyles
    .slice(0, 3)
    .map(
      (item, index) =>
        `${index + 1}. ${item.style} | avg engagement ${item.avgEngagementRate}% | posts ${item.postCount}`,
    )
    .join('\n');
  const strategyLines = insights.recommendedContentStrategy
    .slice(0, 4)
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n');

  return [
    'Optimization context from previous post analytics:',
    `- Best posting time: ${insights.bestPostingTime}`,
    `- Average engagement rate: ${insights.averageEngagementRate}%`,
    '- Best performing topics:',
    topicLines || '1. AI agents | avg engagement 7% | best hook Contrarian | best time Morning',
    '- Best performing hook styles:',
    hookLines || '1. Contrarian | avg engagement 7% | posts 5',
    '- Recommended strategy:',
    strategyLines || '1. Lead with a stronger opinion and a faster payoff.',
    'Use this context to make the hook sharper, the takeaway clearer, and the thread more likely to earn replies and reposts.',
  ].join('\n');
}

function makeOptimizedPrompt(
  input: GenerateTopicInput,
  insights: AnalyticsInsightsResponse,
): string {
  return [
    'Generate optimized X content for the account @AIFutureBrief using analytics from its previous posts.',
    'Tone requirements: insightful, slightly provocative, concise, clear for a tech audience.',
    'Return JSON only using this exact shape:',
    '{"tweet":"string","thread":["tweet1","tweet2","tweet3","tweet4","tweet5","tweet6"],"replies":["reply1","reply2","reply3"]}',
    'Rules:',
    '- The single tweet should feel post-worthy on its own and stay under 280 characters.',
    '- The thread must contain exactly 6 tweets.',
    '- The first thread tweet must be a strong hook.',
    '- Make every thread tweet easy to read.',
    '- No hashtags anywhere in the output.',
    '- Favor hook patterns and framing styles that are most consistent with the analytics context below.',
    '- Do not mention analytics, engagement rates, or posting times inside the generated content.',
    '- The three replies should sound natural on large AI posts.',
    buildInsightsPrompt(insights),
    `Topic: ${input.topic}`,
  ].join('\n');
}

async function requestGeneratedContent(prompt: string): Promise<GeneratePostResponse> {
  const response = await client!.responses.create({
    model: env.OPENAI_MODEL,
    input: prompt,
    text: {
      format: {
        type: 'json_object',
      },
    },
  });

  const rawOutput = response.output_text?.trim();

  if (!rawOutput) {
    throw new Error('The OpenAI API returned an empty response.');
  }

  return outputSchema.parse(
    sanitizeResponse(JSON.parse(rawOutput) as GeneratePostResponse),
  );
}

export async function generateContent(
  input: GenerateTopicInput,
): Promise<GeneratePostResponse> {
  if (!client) {
    return outputSchema.parse(sanitizeResponse(buildMockGeneration(input)));
  }

  try {
    return await requestGeneratedContent(makePrompt(input));
  } catch (error) {
    console.error('OpenAI generation failed, falling back to local content.', error);
    return outputSchema.parse(sanitizeResponse(buildMockGeneration(input)));
  }
}

export async function generateOptimizedContent(
  input: GenerateTopicInput,
): Promise<GeneratePostResponse> {
  const insights = getAnalyticsInsights();

  if (!client) {
    return outputSchema.parse(sanitizeResponse(buildOptimizedMockGeneration(input, insights)));
  }

  try {
    return await requestGeneratedContent(makeOptimizedPrompt(input, insights));
  } catch (error) {
    console.error('Optimized OpenAI generation failed, falling back to local content.', error);
    return outputSchema.parse(sanitizeResponse(buildOptimizedMockGeneration(input, insights)));
  }
}

