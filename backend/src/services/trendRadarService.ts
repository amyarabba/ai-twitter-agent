import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const GITHUB_API =
  'https://api.github.com/search/repositories?q=artificial-intelligence&sort=stars&order=desc&per_page=5';

const HN_TOP_API =
  'https://hacker-news.firebaseio.com/v0/topstories.json';

export interface TrendSignal {
  title: string;
  description: string;
  url: string;
}

async function fetchGithubTrends(): Promise<TrendSignal[]> {
  try {
    const res = await fetch(GITHUB_API);
    const data = (await res.json()) as any;

    return (data.items || []).map((repo: any) => ({
      title: repo.name,
      description: repo.description || 'AI project gaining traction',
      url: repo.html_url,
    }));
  } catch (error) {
    console.error('GitHub trend fetch failed', error);
    return [];
  }
}

async function fetchHackerNewsTrends(): Promise<TrendSignal[]> {
  try {
    const res = await fetch(HN_TOP_API);
   const ids = (await res.json()) as number[];

    const top = ids.slice(0, 10);

    const stories: any[] = await Promise.all(
  top.map(async (id: number) => {
    const r = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
    );
    const data: any = await r.json();
    return data;
  }),
);

    return stories
      .filter((s: any) => s?.title?.toLowerCase().includes('ai'))
      .map((s: any) => ({
        title: s.title,
        description: 'Trending discussion on Hacker News',
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      }));
  } catch (error) {
    console.error('HackerNews fetch failed', error);
    return [];
  }
}

export async function detectTrendSignals(): Promise<TrendSignal[]> {
  const github = await fetchGithubTrends();
  const hn = await fetchHackerNewsTrends();

  const twitterText = await fetchAITwitterSignals();

  const twitterSignals: TrendSignal[] = twitterText
    ? [
        {
          title: "AI discussion trending on Twitter",
          description: twitterText,
          url: "https://twitter.com/search?q=AI",
        },
      ]
    : [];

  return [...github, ...hn, ...twitterSignals].slice(0, 6);
}
export async function generateTrendTweet(
  signal: TrendSignal,
): Promise<string | null> {
  try {
    const prompt = `
You are writing a tweet for the AI account @AIFutureBrief.

Topic: ${signal.title}
Context: ${signal.description}

Rules:
- Sound human
- Insightful
- Under 240 characters
- No hashtags
- No marketing tone
`;

    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: prompt,
    });

    return response.output_text?.trim() ?? null;
  } catch (error) {
    console.error('Trend tweet generation failed', error);
    return null;
  }
}

async function fetchAITwitterSignals() {
  try {
    const rss =
      "https://rsshub.app/twitter/search/AI";

    const res = await fetch(rss);
    const text = await res.text();

    return text.slice(0, 1000);
  } catch (err) {
    console.log("Twitter RSS unavailable");
    return "";
  }
}