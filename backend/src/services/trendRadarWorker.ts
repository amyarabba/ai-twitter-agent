import { detectTrendSignals, generateTrendTweet } from './trendRadarService.js';
import { queuePost } from './postRepository.js';
import { sleepRandom } from '../utils/sleep.js';

export function startTrendRadar() {
console.log('Trend Radar started.');

// Run every 30 minutes
setInterval(() => {
runTrendRadarCycle();
}, 30 * 60 * 1000);
}

async function runTrendRadarCycle() {
try {
const signals = await detectTrendSignals();

```
if (!signals.length) {
  console.log('Trend radar found no signals.');
  return;
}

for (const signal of signals) {
  const tweet = await generateTrendTweet(signal);

  if (!tweet) {
    continue;
  }

  await queuePost({
    text: tweet,
    type: 'tweet',
  });

  await sleepRandom();
}

console.log('Trend radar processed ' + signals.length + ' signals.');
```

} catch (error) {
console.error('Trend radar cycle failed:', error);
}
}