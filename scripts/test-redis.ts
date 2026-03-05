/**
 * scripts/test-redis.ts — Task 02.6.18
 * Verifies Upstash Redis connectivity and rate limiter behavior.
 * Run: npx tsx scripts/test-redis.ts
 */

import { resolve } from 'node:path';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

// Load .env.local before any imports that read process.env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TEST_KEY = 'metamen100:test:connection';
const TEST_TTL_SECONDS = 60;
const TEST_IDENTIFIER = 'test-user-connectivity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function ok(label: string, detail?: string): void {
  passed++;
  console.log(`✅  ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label: string, detail?: string): void {
  failed++;
  console.error(`❌  ${label}${detail ? ` — ${detail}` : ''}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('============================================================');
  console.log('METAMEN100 — Upstash Redis Connectivity Test');
  console.log('Task: 02.6.18');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  // Step 1: Validate env vars
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    fail('Env vars', 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing in .env.local');
    process.exit(1);
  }
  ok('Env vars', `URL=${url}`);

  const redis = new Redis({ url, token });

  // Step 2: PING
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      ok('PING', 'received PONG');
    } else {
      fail('PING', `expected PONG, got ${String(pong)}`);
    }
  } catch (err) {
    fail('PING', err instanceof Error ? err.message : String(err));
  }

  // Step 3: SET with TTL
  try {
    await redis.set(TEST_KEY, 'ok', { ex: TEST_TTL_SECONDS });
    ok('SET', `key="${TEST_KEY}" ttl=${TEST_TTL_SECONDS}s`);
  } catch (err) {
    fail('SET', err instanceof Error ? err.message : String(err));
  }

  // Step 4: GET and verify value
  try {
    const value = await redis.get<string>(TEST_KEY);
    if (value === 'ok') {
      ok('GET', `value="${value}"`);
    } else {
      fail('GET', `expected "ok", got "${String(value)}"`);
    }
  } catch (err) {
    fail('GET', err instanceof Error ? err.message : String(err));
  }

  // Step 5: DEL
  try {
    await redis.del(TEST_KEY);
    const after = await redis.get<string>(TEST_KEY);
    if (after === null) {
      ok('DEL', 'key removed successfully');
    } else {
      fail('DEL', 'key still exists after delete');
    }
  } catch (err) {
    fail('DEL', err instanceof Error ? err.message : String(err));
  }

  // Step 6: Rate limiter — registerLimiter (3 req / 1 hour)
  const registerLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'metamen:rl:test-register',
    ephemeralCache: new Map(),
  });

  console.log('\n--- Rate limiter test (registerLimiter: 3 req / 1h) ---');

  let prevRemaining: number | undefined;
  let rateLimitOk = true;

  for (let i = 1; i <= 3; i++) {
    try {
      const result = await registerLimiter.limit(TEST_IDENTIFIER);
      const { success, limit, remaining, reset } = result;
      const resetIn = Math.round((reset - Date.now()) / 1000);
      console.log(
        `  Request ${i}/3: success=${String(success)} limit=${limit} remaining=${remaining} reset_in=${resetIn}s`,
      );

      // Verify remaining decrements
      if (prevRemaining !== undefined && remaining >= prevRemaining) {
        fail(
          `Rate limiter request ${i}`,
          `remaining did not decrement: ${prevRemaining} → ${remaining}`,
        );
        rateLimitOk = false;
      }
      prevRemaining = remaining;
    } catch (err) {
      fail(`Rate limiter request ${i}`, err instanceof Error ? err.message : String(err));
      rateLimitOk = false;
    }
  }

  if (rateLimitOk) {
    ok('Rate limiter', 'counter decrements correctly across 3 requests');
  }

  // Cleanup rate limit test keys
  try {
    const pattern = 'metamen:rl:test-register*';
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Non-critical cleanup — ignore errors
  }

  // Summary
  console.log('\n============================================================');
  console.log(`RESULT: ${passed} passed | ${failed} failed`);
  console.log('============================================================');

  process.exit(failed > 0 ? 1 : 0);
}

void main();
