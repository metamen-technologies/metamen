import Stripe from 'stripe';

import { env } from '@/lib/env';

// Stripe server-side client — SOLO para Server Actions, API Routes y webhooks.
// NUNCA importar este modulo en codigo client-side.
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
  appInfo: {
    name: 'MetaMen100',
    version: '0.1.0',
  },
});

// Re-exportar tipos utiles para consumidores
export type { Stripe };
