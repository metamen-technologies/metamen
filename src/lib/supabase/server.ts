import { cookies } from 'next/headers';

import { type CookieOptions, createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/supabase/types';

/**
 * Server Supabase client — para Server Components y Server Actions.
 * Opera bajo RLS con la sesión del usuario autenticado.
 *
 * EXCEPCIÓN RULE 5: No se importa @/lib/env porque @supabase/ssr
 * requiere las vars en contextos Edge donde @t3-oss/env-nextjs
 * podría no estar inicializado. Las NEXT_PUBLIC_ vars son seguras
 * vía process.env en server.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // El set puede fallar si se llama desde un Server Component.
            // Esto es seguro de ignorar si el middleware refresca la sesión.
          }
        },
      },
    },
  );
}
