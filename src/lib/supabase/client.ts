'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/supabase/types';

/**
 * Browser Supabase client — solo para componentes 'use client'.
 * Opera bajo RLS con la sesión del usuario.
 *
 * EXCEPCIÓN RULE 5: No se importa @/lib/env porque este módulo
 * ejecuta en el browser donde @t3-oss/env-nextjs no funciona.
 * Las NEXT_PUBLIC_ vars están disponibles vía process.env en client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
