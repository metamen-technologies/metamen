import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Env validation — fail fast at module load if vars are missing
// ---------------------------------------------------------------------------

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    'Missing Upstash Redis env vars: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.',
  );
}

// ---------------------------------------------------------------------------
// Singleton Redis client
// ---------------------------------------------------------------------------

export const redis = new Redis({ url, token });

// ---------------------------------------------------------------------------
// isRedisAvailable — fail-open: returns false instead of throwing
// ---------------------------------------------------------------------------

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
