import { publicEnv } from '@/lib/env';

// Stripe Publishable Key para uso client-side (Stripe.js / @stripe/stripe-js).
// Se usa en componentes que inicializan Stripe Elements o redirigen a Checkout.
export const stripePublishableKey = publicEnv.stripePublishableKey;

// Configuracion compartida para Stripe client-side
export const STRIPE_CONFIG = {
  // Locale para Stripe Elements
  locale: 'es-419' as const,
  // Appearance para Stripe Elements (dark theme METAMEN100)
  appearance: {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#FF073A',
      colorBackground: '#0A0A0A',
      colorText: '#FFFFFF',
      colorDanger: '#FF0000',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  },
} as const;
