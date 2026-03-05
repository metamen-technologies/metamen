import { Ratelimit } from '@upstash/ratelimit';

import { redis } from './client';

// ---------------------------------------------------------------------------
// Result type for rate limit checks
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (ms) when the window resets
}

// ---------------------------------------------------------------------------
// Rate limiters — Constantes Maestras §5.11 + Tech Spec §9
// Sliding window algorithm for accurate per-window enforcement.
// All limiters are fail-open: if Redis is unreachable, requests pass through.
// ---------------------------------------------------------------------------

/** Login: 5 requests / 1 hour per IP+email */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'metamen:rl:auth',
  ephemeralCache: new Map(),
});

/** Register / verify-phone / reset-password: 3 requests / 1 hour per IP */
export const registerLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'metamen:rl:register',
  ephemeralCache: new Map(),
});

/** Complete task: 50 requests / 1 hour per user_id */
export const taskCompletionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 h'),
  prefix: 'metamen:rl:task-completion',
  ephemeralCache: new Map(),
});

/** GET tasks: 100 requests / 1 minute per user_id */
export const readTasksLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'metamen:rl:read-tasks',
  ephemeralCache: new Map(),
});

/** Store purchase: 10 requests / 1 minute per user_id */
export const storePurchaseLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'metamen:rl:store-purchase',
  ephemeralCache: new Map(),
});

/** GET store: 100 requests / 1 minute per user_id */
export const storeBrowseLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'metamen:rl:store-browse',
  ephemeralCache: new Map(),
});

/** Image generation: 5 requests / 1 hour per user_id */
export const imageGenerationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'metamen:rl:image-generation',
  ephemeralCache: new Map(),
});
