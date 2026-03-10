import { detectCompetitorSignals } from "./competitorRadarService.js";
import { generateQuoteTweet } from "./quoteGeneratorService.js";
import { queuePost } from "./postRepository.js";
import { sleepRandom } from "../utils/sleep.js";

export async function runCompetitorCycle() {
  const signals = await detectCompetitorSignals();

  for (const signal of signals) {
    const tweet = await generateQuoteTweet(signal.description);

    if (!tweet) continue;

    await queuePost({
      text: tweet,
      type: "tweet",
    });

    await sleepRandom();
  }
}