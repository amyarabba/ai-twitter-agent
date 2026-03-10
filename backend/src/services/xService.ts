import crypto from 'node:crypto';

import { env } from '../config/env.js';
import type { PublishPostResult } from '../types/content.js';

const CREATE_TWEET_URL = 'https://api.x.com/2/tweets';

function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/'/g, '%27');
}

function buildOAuth1Header(method: string, url: string): string {
  if (
    !env.X_API_KEY ||
    !env.X_API_SECRET ||
    !env.X_ACCESS_TOKEN ||
    !env.X_ACCESS_SECRET
  ) {
    throw new Error('Missing X OAuth 1.0a credentials.');
  }

  const oauthParams = {
    oauth_consumer_key: env.X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  const normalized = Object.entries(oauthParams)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
    .join('&');

  const signatureBase = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(normalized),
  ].join('&');
  const signingKey = `${percentEncode(env.X_API_SECRET)}&${percentEncode(env.X_ACCESS_SECRET)}`;
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  return (
    'OAuth ' +
    Object.entries({
      ...oauthParams,
      oauth_signature: signature,
    })
      .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
      .join(', ')
  );
}

function buildHeaders(method: string, url: string): Record<string, string> {
  if (env.xAuthMode === 'oauth2' && env.X_OAUTH2_ACCESS_TOKEN) {
    return {
      Authorization: `Bearer ${env.X_OAUTH2_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  if (env.xAuthMode === 'oauth1a') {
    return {
      Authorization: buildOAuth1Header(method, url),
      'Content-Type': 'application/json',
    };
  }

  throw new Error('X posting credentials are not configured.');
}

async function createTweet(text: string, replyToId?: string): Promise<string> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error('Cannot publish an empty X post.');
  }

  const body = replyToId
    ? {
        text: normalizedText,
        reply: {
          in_reply_to_tweet_id: replyToId,
        },
      }
    : { text: normalizedText };

  const response = await fetch(CREATE_TWEET_URL, {
    method: 'POST',
    headers: buildHeaders('POST', CREATE_TWEET_URL),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`X create post failed (${response.status}): ${details}`);
  }

  const payload = (await response.json()) as { data?: { id?: string } };
  const tweetId = payload.data?.id;

  if (!tweetId) {
    throw new Error('X create post succeeded but no tweet id was returned.');
  }

  return tweetId;
}

export function isXPublishingReady(): boolean {
  return env.hasXCredentials;
}

export async function postTweet(text: string): Promise<PublishPostResult> {
  const tweetId = await createTweet(text);

  return {
    rootTweetId: tweetId,
    tweetIds: [tweetId],
  };
}

export async function postThread(tweets: string[]): Promise<PublishPostResult> {
  if (tweets.length === 0) {
    throw new Error('Cannot post an empty thread.');
  }

  if (tweets.length > 10) {
    throw new Error('Threads are limited to 6 posts in this system.');
  }

  const tweetIds: string[] = [];
  let replyToId: string | undefined;

  for (const tweet of tweets) {
    const tweetId = await createTweet(tweet, replyToId);
    tweetIds.push(tweetId);
    replyToId = tweetId;
  }

  const rootTweetId = tweetIds[0];

  if (!rootTweetId) {
    throw new Error('X thread publishing completed without a root tweet id.');
  }

  return {
    rootTweetId,
    tweetIds,
  };
}

export async function postReply(
  text: string,
  replyToTweetId: string,
): Promise<string> {
  const normalizedReplyToId = replyToTweetId.trim();

  if (!normalizedReplyToId) {
    throw new Error('Reply target tweet id is required.');
  }

  return createTweet(text, normalizedReplyToId);
}
