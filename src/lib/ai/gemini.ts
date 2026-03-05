import { GoogleGenerativeAI } from '@google/generative-ai';

import { env } from '@/lib/env';

// ---------------------------------------------------------------------------
// Result monad (local definition — no @/lib/core/types/result exists yet)
// ---------------------------------------------------------------------------

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VectorsSnapshot {
  readonly aura: number; // 0-50
  readonly jawline: number; // 0-50
  readonly wealth: number; // 0-50
  readonly physique: number; // 0-50
  readonly social: number; // 0-50
  readonly env: number; // 1-10 (integer)
}

interface GenerateAvatarParams {
  readonly baseAvatarId: number; // 1-6
  readonly vectorsSnapshot: VectorsSnapshot;
  readonly healthPoints: number; // 1-14
  readonly equippedItems: readonly string[]; // ai_tokens from equipped items (may be empty)
}

interface GenerateAvatarSuccess {
  readonly imageBase64: string; // base64 encoded image data
  readonly mimeType: string; // e.g. 'image/png'
  readonly promptUsed: string; // full prompt sent to Gemini (for debugging/logging)
}

type GeminiErrorCode =
  | 'INVALID_PARAMS'
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'ALL_RETRIES_FAILED';

interface GeminiError {
  readonly code: GeminiErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}

// ---------------------------------------------------------------------------
// Constants — Style header (06_content_spec S5.1)
// ---------------------------------------------------------------------------

const STYLE_HEADER =
  'Professional portrait photography, cinematic lighting, 8k resolution, photorealistic, highly detailed, front-facing portrait, neutral background, studio quality' as const;

// ---------------------------------------------------------------------------
// Constants — Identity anchors (06_content_spec S3.3)
// ---------------------------------------------------------------------------

const IDENTITY_ANCHORS = {
  1: 'Hispanic male, mid 30s, brown dreadlocks thick and long, round friendly face, warm brown skin, casual clothing, slightly overweight physique, gamer aesthetic, CONSISTENT FACIAL FEATURES',
  2: 'Hispanic male, mid 30s, bald shaved head, square jaw structure, small intense eyes, thick neck, tan skin tone, muscular build under fat, CONSISTENT FACIAL FEATURES',
  3: 'Hispanic male, late 20s, curly auburn-brown hair messy, face covered in freckles, green-hazel eyes, pointed chin, thin build, CONSISTENT FACIAL FEATURES',
  4: 'Hispanic male, mid 40s, balding with long hair in back, thick black goatee beard, deep-set brown eyes, weathered face, medium build with some belly, CONSISTENT FACIAL FEATURES',
  5: 'Hispanic male, early 30s, blonde wavy hair styled back, boyish face structure, bright blue eyes, dimpled chin, soft midsection with thin legs, CONSISTENT FACIAL FEATURES',
  6: 'Hispanic male, late 30s, black hair with receding hairline, rectangular glasses, stubble beard, tired intelligent eyes, office body with belly under shirt, CONSISTENT FACIAL FEATURES',
} as const satisfies Record<number, string>;

// ---------------------------------------------------------------------------
// Constants — Vector tokens
// ---------------------------------------------------------------------------

// PHYSIQUE: 06_content_spec S5.2 (scale 0-50, step 5, 11 entries)
const PHYSIQUE_TOKENS = {
  0: 'morbidly obese body, massive belly overhang, no visible muscle',
  5: 'severely obese body, large belly, minimal muscle tone',
  10: 'obese body type, prominent belly, slight muscle under fat',
  15: 'chubby body, soft midsection, untrained physique',
  20: 'soft body type, visible belly, minimal definition',
  25: 'average body, some belly fat, developing muscle tone',
  30: 'decent build, muscle becoming visible, some softness',
  35: 'athletic build, visible muscle definition, lean',
  40: 'fit muscular body, clear muscle separation',
  45: 'bodybuilder physique, very defined muscles, six pack',
  50: 'peak human form, superhero physique, impossible definition',
} as const satisfies Record<number, string>;

// JAWLINE: 06_content_spec S5.2 (scale 0-50, step 25, 3 entries)
const JAWLINE_TOKENS = {
  0: 'bloated round face, severe double chin, no jawline visible',
  25: 'balanced face shape, defined chin, jawline clearly visible',
  50: 'divine facial structure, otherworldly sharp features',
} as const satisfies Record<number, string>;

// AURA: 06_content_spec S5.2 (scale 0-50, step 25, 3 entries)
const AURA_TOKENS = {
  0: 'defeated posture, slumped shoulders, downcast eyes',
  25: 'good posture, shoulders squared, steady gaze',
  50: 'semi-god presence, brilliant golden aura surrounding body',
} as const satisfies Record<number, string>;

// WEALTH: 06_content_spec S5.2 (scale 0-50, step 25, 3 entries)
const WEALTH_TOKENS = {
  0: 'dirty torn rags, stained gray shirt, ripped old clothes',
  25: 'business casual, button-down shirt, quality pants',
  50: 'godlike raiment, pure light and gold, celestial warrior',
} as const satisfies Record<number, string>;

// SOCIAL: interpolated from 06_content_spec S2.1 (scale 0-50, step 25, 3 entries)
const SOCIAL_TOKENS = {
  0: 'completely alone, isolated, no one around, desolate atmosphere',
  25: 'few acquaintances nearby, casual social setting, some company',
  50: 'surrounded by admiring crowd, leader of vibrant social circle, magnetic presence',
} as const satisfies Record<number, string>;

// ENV: 02_adrs S5.3 (scale 1-10, 10 entries)
const ENV_TOKENS = {
  1: 'dark dirty street, trash, homeless setting',
  2: 'dark alley, dim streetlight, urban decay',
  3: 'cramped shared room, bunk bed, messy',
  4: 'small studio apartment, basic furniture',
  5: 'comfortable apartment, modern furniture',
  6: 'own house, nice living room, garden',
  7: 'modern house, designer interior, pool',
  8: 'urban penthouse, city skyline view, luxury',
  9: 'mansion, marble floors, chandelier, estate',
  10: 'luxury penthouse, panoramic view, gold accents',
} as const satisfies Record<number, string>;

// HEALTH: 06_content_spec S5.2 (degradation by HP)
// Key 10 = HP >= 10 (up to max 14, no visual effect)
// Key 7 = HP 7-9, Key 4 = HP 4-6, Key 1 = HP 1-3
const HEALTH_TOKENS = {
  10: '',
  7: 'slightly tired appearance, minor fatigue visible',
  4: 'exhausted look, dark circles, pale complexion',
  1: "death's door appearance, ghostly pale, hollow cheeks",
} as const satisfies Record<number, string>;

// ---------------------------------------------------------------------------
// Constants — Configuration
// ---------------------------------------------------------------------------

const MODEL_NAME = 'gemini-2.5-flash' as const;

// 3 retries with exponential backoff: 1s, 5s, 30s (02_adrs S5.4)
const RETRY_DELAYS = [1000, 5000, 30000] as const satisfies readonly number[];

// Total attempts: 1 initial + 3 retries = 4 (02_adrs S5.4)
export const MAX_ATTEMPTS = RETRY_DELAYS.length + 1; // 4

// Timeout per API call (08_test_plan T-08.3.2 P0)
const API_TIMEOUT_MS = 60_000; // 60 seconds

// ---------------------------------------------------------------------------
// Helper — withTimeout
// ---------------------------------------------------------------------------

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs)),
  ]);
}

// ---------------------------------------------------------------------------
// Helper — validateParams
// ---------------------------------------------------------------------------

function validateParams(params: GenerateAvatarParams): Result<void, GeminiError> {
  // Validate baseAvatarId (1-6, integer)
  if (
    params.baseAvatarId < 1 ||
    params.baseAvatarId > 6 ||
    !Number.isInteger(params.baseAvatarId)
  ) {
    return err({
      code: 'INVALID_PARAMS',
      message: `Invalid baseAvatarId: ${params.baseAvatarId}. Must be integer 1-6.`,
    });
  }

  // Validate healthPoints (1-14, integer)
  if (
    params.healthPoints < 1 ||
    params.healthPoints > 14 ||
    !Number.isInteger(params.healthPoints)
  ) {
    return err({
      code: 'INVALID_PARAMS',
      message: `Invalid healthPoints: ${params.healthPoints}. Must be integer 1-14.`,
    });
  }

  // Validate 5 main vectors (0-50)
  const mainVectors = ['aura', 'jawline', 'wealth', 'physique', 'social'] as const;
  for (const key of mainVectors) {
    const value = params.vectorsSnapshot[key];
    if (value < 0 || value > 50) {
      return err({
        code: 'INVALID_PARAMS',
        message: `Invalid vectorsSnapshot.${key}: ${value}. Must be 0-50.`,
      });
    }
  }

  // Validate env vector (1-10, integer)
  const envValue = params.vectorsSnapshot.env;
  if (envValue < 1 || envValue > 10 || !Number.isInteger(envValue)) {
    return err({
      code: 'INVALID_PARAMS',
      message: `Invalid vectorsSnapshot.env: ${envValue}. Must be integer 1-10.`,
    });
  }

  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Helper — getVectorToken
// ---------------------------------------------------------------------------

function getVectorToken(value: number, tokens: Record<number, string>): string {
  const thresholds = Object.keys(tokens)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (value >= threshold) {
      return tokens[threshold] ?? '';
    }
  }

  // Fallback: return token for lowest threshold
  const minThreshold = thresholds[thresholds.length - 1];
  if (minThreshold !== undefined) {
    return tokens[minThreshold] ?? '';
  }
  return '';
}

// ---------------------------------------------------------------------------
// Helper — getHealthToken
// ---------------------------------------------------------------------------

function getHealthToken(healthPoints: number): string {
  const thresholds = Object.keys(HEALTH_TOKENS)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (healthPoints >= threshold) {
      return (HEALTH_TOKENS[threshold as keyof typeof HEALTH_TOKENS] ?? '') as string;
    }
  }

  // HP below all thresholds (should not happen with valid HP 1-14)
  return HEALTH_TOKENS[1];
}

// ---------------------------------------------------------------------------
// buildPrompt
// ---------------------------------------------------------------------------

function buildPrompt(params: GenerateAvatarParams): string {
  const identity = IDENTITY_ANCHORS[params.baseAvatarId as keyof typeof IDENTITY_ANCHORS] ?? '';

  const physiqueToken = getVectorToken(params.vectorsSnapshot.physique, PHYSIQUE_TOKENS);
  const jawlineToken = getVectorToken(params.vectorsSnapshot.jawline, JAWLINE_TOKENS);
  const auraToken = getVectorToken(params.vectorsSnapshot.aura, AURA_TOKENS);
  const wealthToken = getVectorToken(params.vectorsSnapshot.wealth, WEALTH_TOKENS);
  const socialToken = getVectorToken(params.vectorsSnapshot.social, SOCIAL_TOKENS);
  const envToken = (ENV_TOKENS[params.vectorsSnapshot.env as keyof typeof ENV_TOKENS] ??
    '') as string;
  const healthToken = getHealthToken(params.healthPoints);

  const itemsTokens = params.equippedItems.filter((item) => item.trim() !== '');
  const itemsPart = itemsTokens.length > 0 ? itemsTokens.join(', ') : '';

  const parts = [
    STYLE_HEADER,
    identity,
    physiqueToken,
    jawlineToken,
    auraToken,
    wealthToken,
    socialToken,
    itemsPart,
    envToken,
    healthToken,
  ].filter(Boolean);

  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// generateAvatarImage
// ---------------------------------------------------------------------------

export async function generateAvatarImage(
  params: GenerateAvatarParams,
): Promise<Result<GenerateAvatarSuccess, GeminiError>> {
  // Step 1: Validate ALL params
  const validation = validateParams(params);
  if (!validation.ok) {
    return validation;
  }

  // Step 2: Build prompt
  const prompt = buildPrompt(params);

  // Step 3: Initialize Gemini client
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseModalities: ['image', 'text'],
      responseMimeType: 'image/png',
    } as Record<string, unknown>,
  });

  // Step 4: Retry loop — 4 total attempts (1 initial + 3 retries)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const result = await withTimeout(
        model.generateContent(prompt),
        API_TIMEOUT_MS,
        `Gemini API timeout after ${API_TIMEOUT_MS}ms on attempt ${attempt + 1}`,
      );

      const response = result.response;
      const parts = response.candidates?.[0]?.content?.parts;

      if (!parts || parts.length === 0) {
        if (attempt < MAX_ATTEMPTS - 1) {
          const delay = RETRY_DELAYS[attempt];
          if (delay !== undefined) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
          continue;
        }
        return err({
          code: 'INVALID_RESPONSE',
          message: `No parts in Gemini response after ${MAX_ATTEMPTS} attempts`,
        });
      }

      // Search for image data in response parts
      for (const part of parts) {
        if (part.inlineData) {
          return ok({
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType ?? 'image/png',
            promptUsed: prompt,
          });
        }
      }

      // Response has parts but none contain inlineData — retry if attempts remain
      if (attempt < MAX_ATTEMPTS - 1) {
        const delay = RETRY_DELAYS[attempt];
        if (delay !== undefined) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        continue;
      }

      return err({
        code: 'INVALID_RESPONSE',
        message: `Gemini response has parts but no inlineData after ${MAX_ATTEMPTS} attempts`,
      });
    } catch (error: unknown) {
      const isTimeout = error instanceof Error && error.message.includes('timeout');

      if (attempt < MAX_ATTEMPTS - 1) {
        const delay = RETRY_DELAYS[attempt];
        if (delay !== undefined) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        continue;
      }

      return err({
        code: isTimeout ? 'TIMEOUT' : 'ALL_RETRIES_FAILED',
        message: `All ${RETRY_DELAYS.length} retries exhausted (${MAX_ATTEMPTS} total attempts)`,
        cause: error,
      });
    }
  }

  // Unreachable, but TypeScript needs it
  return err({
    code: 'ALL_RETRIES_FAILED',
    message: 'Exhausted all retry attempts',
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  buildPrompt,
  getVectorToken,
  getHealthToken,
  validateParams,
  withTimeout,
  IDENTITY_ANCHORS,
  STYLE_HEADER,
  ENV_TOKENS,
  HEALTH_TOKENS,
  PHYSIQUE_TOKENS,
  JAWLINE_TOKENS,
  AURA_TOKENS,
  WEALTH_TOKENS,
  SOCIAL_TOKENS,
  MODEL_NAME,
  RETRY_DELAYS,
  API_TIMEOUT_MS,
};

export type {
  GenerateAvatarParams,
  GenerateAvatarSuccess,
  GeminiError,
  GeminiErrorCode,
  VectorsSnapshot,
};
