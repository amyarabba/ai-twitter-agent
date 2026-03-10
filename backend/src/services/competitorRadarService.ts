import { AI_COMPETITORS } from "../config/competitors.js";

export async function detectCompetitorSignals() {
  const signals = [];

  for (const username of AI_COMPETITORS) {
    signals.push({
      title: `New tweet from @${username}`,
      description: `AI discussion from ${username}`,
      url: `https://twitter.com/${username}`,
    });
  }

  return signals;
}