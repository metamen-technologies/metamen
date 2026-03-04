import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

import packageJson from '../../../../package.json';

// --- Types ---

const SERVICE_NAMES = [
  'supabase',
  'stripe',
  'gemini',
  'upstash_redis',
  'inngest',
  'sentry',
  'posthog',
] as const;

type ServiceName = (typeof SERVICE_NAMES)[number];

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  services: Record<ServiceName, ServiceStatus>;
}

// --- Helpers ---

async function checkService(
  checkFn: () => Promise<void>,
  timeoutMs = 5000,
): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await Promise.race([
      checkFn(),
      new Promise<never>(function (_, reject) {
        setTimeout(function () {
          reject(new Error('Timeout after ' + timeoutMs + 'ms'));
        }, timeoutMs);
      }),
    ]);
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkEnvVar(envName: string): () => Promise<void> {
  return async function () {
    if (!process.env[envName]) {
      throw new Error(envName + ' is not set');
    }
  };
}

// --- Service Checks ---

async function checkSupabase(): Promise<ServiceStatus> {
  return checkService(async function () {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    const supabase = createClient(url, key);
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw new Error(error.message);
  });
}

async function checkUpstashRedis(): Promise<ServiceStatus> {
  // Upstash Redis se usa para rate limiting (NO para cache general)
  return checkService(async function () {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('Upstash env vars not set');
    const redis = new Redis({ url, token });
    await redis.ping();
  });
}

async function checkPosthog(): Promise<ServiceStatus> {
  // PostHog /decide?v=3 requiere method POST con body JSON
  return checkService(async function () {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!host || !key) throw new Error('PostHog env vars not set');
    const response = await fetch(host + '/decide?v=3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, distinct_id: 'health-check' }),
    });
    if (!response.ok) throw new Error('PostHog returned ' + response.status);
  });
}

// --- Route Handler ---

// Forzar renderizado dinámico — nunca cachear health checks
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const [supabase, stripe, gemini, upstashRedis, inngest, sentry, posthog] = await Promise.all([
    checkSupabase(),
    checkService(checkEnvVar('STRIPE_SECRET_KEY')),
    checkService(checkEnvVar('GEMINI_API_KEY')),
    checkUpstashRedis(),
    checkService(checkEnvVar('INNGEST_EVENT_KEY')),
    checkService(checkEnvVar('SENTRY_DSN')),
    checkPosthog(),
  ]);

  // checkService NUNCA lanza — siempre retorna ServiceStatus
  // por lo tanto Promise.all siempre se resuelve
  const services: Record<ServiceName, ServiceStatus> = {
    supabase,
    stripe,
    gemini,
    upstash_redis: upstashRedis,
    inngest,
    sentry,
    posthog,
  };

  const allHealthy = SERVICE_NAMES.every(function (name) {
    return services[name].status === 'healthy';
  });
  const anyDown = SERVICE_NAMES.some(function (name) {
    return services[name].status === 'down';
  });
  const overallStatus = allHealthy ? 'healthy' : anyDown ? 'down' : 'degraded';

  const response: HealthResponse = {
    status: overallStatus,
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    services,
  };

  return NextResponse.json(response, {
    status: overallStatus === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
