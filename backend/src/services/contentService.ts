import OpenAI from 'openai';
import { z } from 'zod';

import { env } from '../config/env.js';
import { buildMockGeneration } from './mockDataService.js';
import type { GeneratePostResponse, GenerateTopicInput } from '../types/content.js';

const outputSchema = z.object({
  tweet: z.string().trim().min(40).max(280),
  thread: z.array(z.string().trim().min(20).max(280)).length(6),
  replies: z.array(z.string().trim().min(20).max(220)).length(3),
});

const client = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

function cleanPost(text: string): string {
  return text
    .replace(/#[A-Za-z0-9_]+/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function sanitizeResponse(content: GeneratePostResponse): GeneratePostResponse {
  return {
    tweet: cleanPost(content.tweet),
    thread: content.thread.slice(0, 6).map((tweet) => cleanPost(tweet)),
    replies: content.replies.slice(0, 3).map((reply) => cleanPost(reply)),
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

export async function generateContent(
  input: GenerateTopicInput,
): Promise<GeneratePostResponse> {
  if (!client) {
    return buildMockGeneration(input);
  }

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: makePrompt(input),
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

    const parsedPayload = outputSchema.parse(
      sanitizeResponse(JSON.parse(rawOutput) as GeneratePostResponse),
    );

    return parsedPayload;
  } catch (error) {
    console.error('OpenAI generation failed, falling back to local content.', error);
    return buildMockGeneration(input);
  }
}
