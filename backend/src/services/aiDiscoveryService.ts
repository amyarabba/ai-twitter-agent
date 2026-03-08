import OpenAI from 'openai';
import { z } from 'zod';

import { env } from '../config/env.js';
import type {
  AiTopicIdea,
  AiTopicsResponse,
  CompetitorRadarItem,
  CompetitorRadarResponse,
  ViralHooksInput,
  ViralHooksResponse,
} from '../types/content.js';

const topicCategories = [
  'AI breakthroughs',
  'New models',
  'AI startups',
  'Robotics',
  'Open source AI',
  'AI agents',
  'AI tools',
] as const;

const competitorTypes = [
  'Large AI account',
  'Viral discussion',
  'Popular thread',
] as const;

const topicIdeasSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().trim().min(3).max(80),
      title: z.string().trim().min(8).max(140),
      category: z.enum(topicCategories),
      insight: z.string().trim().min(20).max(240),
      suggestedAngle: z.string().trim().min(20).max(240),
    }),
  ).length(10),
});

const hooksSchema = z.object({
  hooks: z.array(z.string().trim().min(20).max(220)).length(5),
});

const competitorsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().trim().min(3).max(80),
      label: z.string().trim().min(4).max(90),
      handle: z.string().trim().min(2).max(50).nullable(),
      type: z.enum(competitorTypes),
      reason: z.string().trim().min(20).max(220),
      angle: z.string().trim().min(20).max(220),
      audience: z.string().trim().min(8).max(120),
    }),
  ).min(5).max(8),
});

const client = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

const fallbackTopics: AiTopicIdea[] = [
  {
    id: 'synthetic-data-breakthroughs',
    title: 'Synthetic data is becoming the hidden edge for smaller AI research teams',
    category: 'AI breakthroughs',
    insight:
      'Teams with limited proprietary data are using synthetic loops to move faster on evaluation, tuning, and edge-case coverage.',
    suggestedAngle:
      'Explain why synthetic data is shifting from a hacky workaround into a serious acceleration layer for AI products.',
  },
  {
    id: 'specialized-reasoning-models',
    title: 'Specialized reasoning models are challenging the one-model-for-everything playbook',
    category: 'New models',
    insight:
      'Builders are increasingly mixing smaller expert systems with frontier models instead of betting the whole product on one general model.',
    suggestedAngle:
      'Frame it as the end of benchmark theater and the start of model portfolio strategy.',
  },
  {
    id: 'vertical-ai-startups-outcomes',
    title: 'Vertical AI startups are selling outcomes instead of copilots',
    category: 'AI startups',
    insight:
      'Founders with the strongest traction are packaging AI around time saved, revenue gained, and workflow ownership.',
    suggestedAngle:
      'Show why the best AI startups are not pitching assistants anymore. They are pitching completed work.',
  },
  {
    id: 'warehouse-robotics-momentum',
    title: 'Warehouse robotics is where foundation-model hype is finally meeting operational reality',
    category: 'Robotics',
    insight:
      'Robotics wins are increasingly about reliability, recovery, and labor economics instead of flashy demos.',
    suggestedAngle:
      'Turn robotics coverage into a business story about where physical AI can compound first.',
  },
  {
    id: 'open-source-voice-vision-stacks',
    title: 'Open source voice and vision stacks are quietly shrinking product launch timelines',
    category: 'Open source AI',
    insight:
      'Teams can now assemble capable multimodal prototypes without paying frontier-model pricing on day one.',
    suggestedAngle:
      'Contrast expensive model dependence with the new speed of open source experimentation.',
  },
  {
    id: 'back-office-agents',
    title: 'Back-office AI agents are starting to replace brittle dashboard workflows',
    category: 'AI agents',
    insight:
      'The big shift is not chat interfaces. It is agents taking ownership of repetitive internal processes with human review in the loop.',
    suggestedAngle:
      'Make the case that AI agents are redefining the product surface for knowledge work software.',
  },
  {
    id: 'ai-tooling-operating-system',
    title: 'AI workflow tools are becoming the new operating system for knowledge work',
    category: 'AI tools',
    insight:
      'The stickiest tools are no longer single prompts. They stitch context, memory, approvals, and execution into one layer.',
    suggestedAngle:
      'Position AI tools as systems of action rather than collections of prompts.',
  },
  {
    id: 'on-device-inference',
    title: 'Inference efficiency breakthroughs are changing who can ship useful on-device AI',
    category: 'AI breakthroughs',
    insight:
      'Lower latency and lower cost are making edge deployment more viable for products that need speed, privacy, or offline resilience.',
    suggestedAngle:
      'Tie efficiency gains to market expansion instead of treating them like niche engineering wins.',
  },
  {
    id: 'small-open-models-latency',
    title: 'Smaller open models are winning where latency matters more than benchmark prestige',
    category: 'New models',
    insight:
      'Fast, good-enough models are often the better commercial choice when the product experience depends on responsiveness.',
    suggestedAngle:
      'Challenge the idea that the biggest model automatically creates the strongest product.',
  },
  {
    id: 'voice-agents-support-stack',
    title: 'Voice-first agent tools are carving out a wedge into customer support stacks',
    category: 'AI tools',
    insight:
      'Voice agents are moving from novelty to serious workflow coverage where speed and consistency matter more than perfect conversation.',
    suggestedAngle:
      'Explore how voice agents could become the first AI layer users interact with at scale.',
  },
];

const fallbackCompetitors: CompetitorRadarItem[] = [
  {
    id: 'openai-launch-posts',
    label: 'OpenAI launch and roadmap posts',
    handle: '@OpenAI',
    type: 'Large AI account',
    reason:
      'Major model and product updates from OpenAI still shape a large share of the AI timeline and trigger fast reaction cycles.',
    angle:
      'Reply with what the launch changes for builders, not just what it means for benchmarks.',
    audience: 'AI builders, founders, and product teams',
  },
  {
    id: 'anthropic-system-posts',
    label: 'Anthropic product and safety threads',
    handle: '@AnthropicAI',
    type: 'Large AI account',
    reason:
      'Anthropic posts often attract a technical audience that engages with tradeoffs around reliability, agents, and enterprise adoption.',
    angle:
      'Quote the thread with a take on where product usability is outrunning raw model comparisons.',
    audience: 'Technical operators and enterprise AI buyers',
  },
  {
    id: 'agents-vs-saas-debate',
    label: 'The AI agents replacing SaaS debate',
    handle: null,
    type: 'Viral discussion',
    reason:
      'This discussion resurfaces because it ties product design, pricing pressure, and workflow ownership into one provocative narrative.',
    angle:
      'Take a side on whether agents replace software seats or just become the new interface layer on top.',
    audience: 'Founders, operators, and software investors',
  },
  {
    id: 'open-model-cost-discussion',
    label: 'Open-model cost and moat arguments',
    handle: null,
    type: 'Viral discussion',
    reason:
      'Posts comparing open models, inference costs, and proprietary moats reliably pull in strong opinions from builders and researchers.',
    angle:
      'Add a concise take on where cost advantage translates into product advantage and where it does not.',
    audience: 'Infra builders, AI engineers, and startup teams',
  },
  {
    id: 'tool-teardown-threads',
    label: 'Builder teardown threads on fast-growing AI tools',
    handle: null,
    type: 'Popular thread',
    reason:
      'Detailed teardowns of AI products tend to perform because they turn hype into product lessons people can immediately apply.',
    angle:
      'Reply with the one distribution or workflow lesson most people in the thread are missing.',
    audience: 'Product builders and indie hackers',
  },
  {
    id: 'robotics-deployment-threads',
    label: 'Robotics deployment threads with hard operational numbers',
    handle: null,
    type: 'Popular thread',
    reason:
      'Robotics threads get outsized engagement when they combine visual proof with clear evidence of labor, cost, or throughput gains.',
    angle:
      'Quote the thread and connect the deployment story to the next AI category likely to move from demo to budget line.',
    audience: 'Operators, investors, and industrial AI followers',
  },
];

function cleanText(text: string): string {
  return text
    .replace(/#[A-Za-z0-9_]+/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function sanitizeTopicIdeas(items: AiTopicIdea[]): AiTopicIdea[] {
  return items.map((item, index) => ({
    id: slugify(item.id || item.title) || `topic-${index + 1}`,
    title: cleanText(item.title),
    category: item.category,
    insight: cleanText(item.insight),
    suggestedAngle: cleanText(item.suggestedAngle),
  }));
}

function sanitizeHooks(topic: string, hooks: string[]): ViralHooksResponse {
  return {
    topic: cleanText(topic),
    generatedAt: new Date().toISOString(),
    hooks: hooks.map((hook) => cleanText(hook)).slice(0, 5),
  };
}

function sanitizeCompetitors(items: CompetitorRadarItem[]): CompetitorRadarItem[] {
  return items.map((item, index) => ({
    id: slugify(item.id || item.label) || `target-${index + 1}`,
    label: cleanText(item.label),
    handle: item.handle ? cleanText(item.handle) : null,
    type: item.type,
    reason: cleanText(item.reason),
    angle: cleanText(item.angle),
    audience: cleanText(item.audience),
  }));
}

function buildFallbackHooks(input: ViralHooksInput): ViralHooksResponse {
  const topic = cleanText(input.topic);

  return sanitizeHooks(topic, [
    `${topic} is being framed like a feature upgrade. It looks more like a business model reset.`,
    `The most important part of ${topic} is not the demo. It is what breaks when teams can suddenly move 10x faster.`,
    `Hot take: ${topic} matters less for capability theater and more for who captures the workflow.`,
    `Everyone is watching benchmarks. ${topic} is really about who owns the habit loop once AI becomes the default operator.`,
    `If ${topic} keeps improving, a lot of must-have software starts looking like temporary scaffolding.`,
  ]);
}

function buildTopicsPrompt(): string {
  return [
    'Generate 10 timely AI content ideas for the X account @AIFutureBrief.',
    'Return JSON only with this exact shape:',
    '{"items":[{"id":"short-slug","title":"string","category":"AI breakthroughs","insight":"string","suggestedAngle":"string"}]}',
    'Rules:',
    '- Return exactly 10 items.',
    `- Categories must be chosen from: ${topicCategories.join(', ')}.`,
    '- Cover every category at least once, then repeat the strongest categories if needed.',
    '- Titles should feel like strong content prompts for X, not full tweets.',
    '- Keep insight and suggestedAngle concise and specific.',
    '- No hashtags.',
    '- Focus on AI breakthroughs, new models, startups, robotics, open source AI, AI agents, and AI tools.',
  ].join('\n');
}

function buildHooksPrompt(input: ViralHooksInput): string {
  return [
    'Generate 5 viral hook tweet ideas for the X account @AIFutureBrief.',
    'Return JSON only with this exact shape:',
    '{"hooks":["hook 1","hook 2","hook 3","hook 4","hook 5"]}',
    'Tone: insightful, slightly provocative, concise, clear for a tech audience.',
    'Rules:',
    '- Each hook should feel post-worthy on its own.',
    '- Keep them short and easy to read.',
    '- No hashtags.',
    `Topic: ${input.topic}`,
  ].join('\n');
}

function buildCompetitorsPrompt(): string {
  return [
    'Generate a competitor radar for the X account @AIFutureBrief.',
    'Return JSON only with this exact shape:',
    '{"items":[{"id":"short-slug","label":"string","handle":"@account or null","type":"Large AI account","reason":"string","angle":"string","audience":"string"}]}',
    'Rules:',
    '- Return 6 items.',
    `- type must be one of: ${competitorTypes.join(', ')}.`,
    '- Include a mix of large AI accounts, recent-style viral AI discussions, and popular AI thread targets.',
    '- Keep each reason, angle, and audience field concise and useful.',
    '- No hashtags.',
  ].join('\n');
}

export async function getAiTopics(): Promise<AiTopicsResponse> {
  if (!client) {
    return {
      generatedAt: new Date().toISOString(),
      items: sanitizeTopicIdeas(fallbackTopics),
    };
  }

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: buildTopicsPrompt(),
      text: {
        format: {
          type: 'json_object',
        },
      },
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      throw new Error('The OpenAI API returned an empty topic response.');
    }

    const parsed = topicIdeasSchema.parse(JSON.parse(rawOutput));

    return {
      generatedAt: new Date().toISOString(),
      items: sanitizeTopicIdeas(parsed.items),
    };
  } catch (error) {
    console.error('AI topic discovery failed, falling back to local ideas.', error);

    return {
      generatedAt: new Date().toISOString(),
      items: sanitizeTopicIdeas(fallbackTopics),
    };
  }
}

export async function generateViralHooks(
  input: ViralHooksInput,
): Promise<ViralHooksResponse> {
  if (!client) {
    return buildFallbackHooks(input);
  }

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: buildHooksPrompt(input),
      text: {
        format: {
          type: 'json_object',
        },
      },
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      throw new Error('The OpenAI API returned an empty hooks response.');
    }

    const parsed = hooksSchema.parse(JSON.parse(rawOutput));

    return sanitizeHooks(input.topic, parsed.hooks);
  } catch (error) {
    console.error('Viral hook generation failed, falling back to local hooks.', error);
    return buildFallbackHooks(input);
  }
}

export async function getCompetitorRadar(): Promise<CompetitorRadarResponse> {
  if (!client) {
    return {
      generatedAt: new Date().toISOString(),
      items: sanitizeCompetitors(fallbackCompetitors),
    };
  }

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: buildCompetitorsPrompt(),
      text: {
        format: {
          type: 'json_object',
        },
      },
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      throw new Error('The OpenAI API returned an empty competitor radar response.');
    }

    const parsed = competitorsSchema.parse(JSON.parse(rawOutput));

    return {
      generatedAt: new Date().toISOString(),
      items: sanitizeCompetitors(parsed.items),
    };
  } catch (error) {
    console.error('Competitor radar generation failed, falling back to local targets.', error);

    return {
      generatedAt: new Date().toISOString(),
      items: sanitizeCompetitors(fallbackCompetitors),
    };
  }
}
