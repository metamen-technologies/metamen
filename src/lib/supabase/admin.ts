import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

/**
 * Admin Supabase client — usa service_role key, bypasea RLS.
 * Usar SOLO en: webhooks, crons, operaciones privilegiadas server-side.
 * NUNCA importar este módulo en código client-side.
 *
 * Crea una nueva instancia por invocación (stateless en serverless).
 * En entorno serverless de Vercel, cada invocación es efímera,
 * por lo que reutilizar instancias no aporta beneficio real.
 */
export function createAdminClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
