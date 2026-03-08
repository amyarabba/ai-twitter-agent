import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  OPENAI_API_KEY: z.string().trim().optional(),
  OPENAI_MODEL: z.string().trim().default('gpt-5'),
  ALLOWED_ORIGIN: z.string().trim().optional(),
  DATABASE_PATH: z.string().trim().default('./data/growth-agent.sqlite'),
  X_API_KEY: z.string().trim().optional(),
  X_API_SECRET: z.string().trim().optional(),
  X_ACCESS_TOKEN: z.string().trim().optional(),
  X_ACCESS_SECRET: z.string().trim().optional(),
  X_OAUTH2_ACCESS_TOKEN: z.string().trim().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${parsed.error.flatten().formErrors.join(', ')}`,
  );
}

const hasXOAuth2Token = Boolean(parsed.data.X_OAUTH2_ACCESS_TOKEN);
const hasXOAuth1aCredentials = Boolean(
  parsed.data.X_API_KEY &&
    parsed.data.X_API_SECRET &&
    parsed.data.X_ACCESS_TOKEN &&
    parsed.data.X_ACCESS_SECRET,
);

export const env = {
  ...parsed.data,
  hasOpenAIKey: Boolean(parsed.data.OPENAI_API_KEY),
  hasXCredentials: hasXOAuth2Token || hasXOAuth1aCredentials,
  xAuthMode: hasXOAuth2Token
    ? 'oauth2'
    : hasXOAuth1aCredentials
      ? 'oauth1a'
      : 'none',
};
