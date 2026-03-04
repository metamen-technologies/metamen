import { existsSync } from 'node:fs';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { Inngest } from 'inngest';
import { z } from 'zod';

// Load .env.local first, then .env as fallback (dotenv does not overwrite existing vars)
config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

// Validate cwd before anything else
if (!existsSync('package.json')) {
  console.error('❌ Error: script must be run from project root (package.json not found in cwd)');
  process.exit(2);
}

// --- Types ---

type HealthCheckStatus = 'ok' | 'fail';

interface HealthCheckResult {
  service: string;
  status: HealthCheckStatus;
  message: string;
  durationMs: number;
}

interface ValidationSummary {
  results: HealthCheckResult[];
  passed: number;
  failed: number;
  totalServices: number;
}

// --- CLI flags ---

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const ciMode = args.includes('--ci');

// --- Zod schemas for the 13 approved env vars ---

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  // Gemini
  GOOGLE_AI_API_KEY: z.string().startsWith('AIza'),
  // Inngest
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),
  // Observability
  SENTRY_DSN: z.string().url(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith('phc_'),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

type EnvVars = z.infer<typeof envSchema>;

// --- Format validation ---

interface VarCheckResult {
  name: string;
  pass: boolean;
  note: string;
}

function validateFormat(): { results: VarCheckResult[]; env: Partial<EnvVars> } {
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'],
    STRIPE_SECRET_KEY: process.env['STRIPE_SECRET_KEY'],
    STRIPE_WEBHOOK_SECRET: process.env['STRIPE_WEBHOOK_SECRET'],
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    GOOGLE_AI_API_KEY: process.env['GOOGLE_AI_API_KEY'],
    INNGEST_EVENT_KEY: process.env['INNGEST_EVENT_KEY'],
    INNGEST_SIGNING_KEY: process.env['INNGEST_SIGNING_KEY'],
    SENTRY_DSN: process.env['SENTRY_DSN'],
    NEXT_PUBLIC_POSTHOG_KEY: process.env['NEXT_PUBLIC_POSTHOG_KEY'],
    NEXT_PUBLIC_POSTHOG_HOST: process.env['NEXT_PUBLIC_POSTHOG_HOST'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  };

  const parsed = envSchema.safeParse(raw);
  const results: VarCheckResult[] = [];

  const varNotes: Record<keyof EnvVars, string> = {
    NEXT_PUBLIC_SUPABASE_URL: 'Valid URL',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Present',
    SUPABASE_SERVICE_ROLE_KEY: 'Present',
    STRIPE_SECRET_KEY: "Prefix 'sk_' OK",
    STRIPE_WEBHOOK_SECRET: "Prefix 'whsec_' OK",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "Prefix 'pk_' OK",
    GOOGLE_AI_API_KEY: "Prefix 'AIza' OK",
    INNGEST_EVENT_KEY: 'Present',
    INNGEST_SIGNING_KEY: 'Present',
    SENTRY_DSN: 'Valid URL',
    NEXT_PUBLIC_POSTHOG_KEY: "Prefix 'phc_' OK",
    NEXT_PUBLIC_POSTHOG_HOST: 'Valid URL',
    NEXT_PUBLIC_APP_URL: 'Valid URL',
  };

  const keys = Object.keys(varNotes) as Array<keyof EnvVars>;

  for (const key of keys) {
    if (parsed.success) {
      results.push({ name: key, pass: true, note: varNotes[key] });
    } else {
      const fieldError = parsed.error.issues.find((issue) => issue.path[0] === key);
      if (fieldError) {
        const rawVal = raw[key];
        const preview = rawVal ? `'${rawVal.slice(0, 10)}...'` : 'undefined';
        results.push({ name: key, pass: false, note: `${fieldError.message}, got ${preview}` });
      } else {
        results.push({ name: key, pass: true, note: varNotes[key] });
      }
    }
  }

  const env: Partial<EnvVars> = parsed.success ? parsed.data : {};
  return { results, env };
}

// --- Health check helper ---

async function runCheck(service: string, fn: () => Promise<string>): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const message = await fn();
    return { service, status: 'ok', message, durationMs: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { service, status: 'fail', message, durationMs: Date.now() - start };
  }
}

// --- Individual health checks ---

async function checkSupabase(env: Partial<EnvVars>): Promise<HealthCheckResult> {
  return runCheck('Supabase', async () => {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase env vars (format check failed)');
    const supabase = createClient(url, key);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw new Error(error.message);
      return 'Connected (profiles query OK)';
    } finally {
      clearTimeout(timer);
    }
  });
}

async function checkStripe(env: Partial<EnvVars>): Promise<HealthCheckResult> {
  return runCheck('Stripe', async () => {
    const key = env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY (format check failed)');
    const response = await fetch('https://api.stripe.com/v1/products?limit=1', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== 200) {
      const body = await response.text().catch(() => '');
      throw new Error(`${response.status} ${response.statusText} ${body.slice(0, 80)}`);
    }
    return 'API key valid (products endpoint 200)';
  });
}

async function checkGemini(env: Partial<EnvVars>): Promise<HealthCheckResult> {
  return runCheck('Gemini', async () => {
    const key = env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error('Missing GOOGLE_AI_API_KEY (format check failed)');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });
    const result = await Promise.race([
      model.generateContent('Respond with OK'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 10000ms')), 10_000),
      ),
    ]);
    if (!result) throw new Error('No response from Gemini');
    return 'API key valid (generate OK)';
  });
}

async function checkInngest(env: Partial<EnvVars>): Promise<HealthCheckResult> {
  return runCheck('Inngest', async () => {
    const eventKey = env.INNGEST_EVENT_KEY;
    if (!eventKey) throw new Error('Missing INNGEST_EVENT_KEY (format check failed)');
    const inngest = new Inngest({ id: 'metamen100-env-check', eventKey });
    await Promise.race([
      inngest.send({ name: 'env-check/ping', data: { test: true } }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 10000ms')), 10_000),
      ),
    ]);
    return 'Event key valid (send OK)';
  });
}

async function checkSentry(env: Partial<EnvVars>): Promise<HealthCheckResult> {
  return runCheck('Sentry', async () => {
    const dsn = env.SENTRY_DSN;
    if (!dsn) throw new Error('Missing SENTRY_DSN (format check failed)');
    const dsnRegex = /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\.ingest\.sentry\.io\/[0-9]+$/i;
    if (!dsnRegex.test(dsn)) throw new Error('DSN does not match expected format');
    const url = new URL(dsn);
    const host = `${url.protocol}//${url.host}`;
    const response = await fetch(host, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    });
    // Any response (even 4xx) means the host exists
    if (!response) throw new Error('No response from Sentry host');
    return `DSN valid (host reachable, status ${response.status})`;
  });
}

async function checkPosthog(env: Partial<EnvVars>): Promise<HealthCheckResult> {
  return runCheck('PostHog', async () => {
    const host = env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!host) throw new Error('Missing NEXT_PUBLIC_POSTHOG_HOST (format check failed)');
    const response = await fetch(host, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response) throw new Error('No response from PostHog host');
    return `Config valid (host reachable, status ${response.status})`;
  });
}

// --- Output helpers ---

function padName(name: string, width = 38): string {
  return name.padEnd(width);
}

function printFormatResults(varResults: VarCheckResult[]): void {
  console.log('📋 Variable format check (13 variables):');
  for (const r of varResults) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon} ${padName(r.name)} ${r.note}`);
  }
  console.log('');
}

function printHealthResults(results: HealthCheckResult[], isVerbose: boolean): void {
  console.log('🏥 Service connectivity check (6 services):');
  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : '❌';
    const status = r.status === 'ok' ? r.message : `FAILED: ${r.message}`;
    console.log(`${icon} ${padName(r.service, 16)} ${status} (${r.durationMs}ms)`);
    if (isVerbose && r.status === 'fail') {
      console.log(`    ${r.message}`);
    }
  }
  console.log('');
}

// --- Main ---

async function main(): Promise<void> {
  console.log('\n🔍 MetaMen100 — Environment Validation');
  console.log('========================================\n');

  // Step 1: Validate format
  const { results: varResults, env } = validateFormat();
  printFormatResults(varResults);

  const formatFailed = varResults.filter((r) => !r.pass);

  // Step 2: CI mode — only format check
  if (ciMode) {
    const total = varResults.length;
    const passed = total - formatFailed.length;
    console.log('========================================');
    if (formatFailed.length === 0) {
      console.log(
        `✅ ${total}/${total} variables OK — Format validation passed (CI mode, connectivity checks skipped)`,
      );
      process.exit(0);
    } else {
      console.log(
        `❌ ${passed}/${total} variables OK — ${formatFailed.length} variable(s) failed format check`,
      );
      process.exit(1);
    }
  }

  // Step 3: Run health checks in parallel
  const [supabase, stripe, gemini, inngest, sentry, posthog] = await Promise.allSettled([
    checkSupabase(env),
    checkStripe(env),
    checkGemini(env),
    checkInngest(env),
    checkSentry(env),
    checkPosthog(env),
  ]);

  const healthResults: HealthCheckResult[] = [
    supabase,
    stripe,
    gemini,
    inngest,
    sentry,
    posthog,
  ].map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          service: 'Unknown',
          status: 'fail' as HealthCheckStatus,
          message: r.reason instanceof Error ? r.reason.message : String(r.reason),
          durationMs: 0,
        },
  );

  printHealthResults(healthResults, verbose);

  // Step 4: Summary
  const passed = healthResults.filter((r) => r.status === 'ok').length;
  const failed = healthResults.length - passed;
  const failedNames = healthResults
    .filter((r) => r.status === 'fail')
    .map((r) => r.service)
    .join(', ');

  const summary: ValidationSummary = {
    results: healthResults,
    passed,
    failed,
    totalServices: healthResults.length,
  };

  console.log('========================================');
  if (summary.failed === 0) {
    console.log(
      `✅ ${summary.passed}/${summary.totalServices} services OK — Environment is ready!`,
    );
    process.exit(0);
  } else {
    console.log(
      `❌ ${summary.passed}/${summary.totalServices} services OK — ${summary.failed} service(s) failed`,
    );
    console.log(`Failed: ${failedNames}`);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
