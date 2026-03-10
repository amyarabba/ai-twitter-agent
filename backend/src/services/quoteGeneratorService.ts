import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateQuoteTweet(text: string) {
  const prompt = `
Write a short insightful quote tweet responding to this AI discussion.

${text}

Rules:
- under 200 characters
- insightful
- human tone
- no hashtags
`;

  const res = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: prompt,
  });

  return res.output_text?.trim() ?? null;
}