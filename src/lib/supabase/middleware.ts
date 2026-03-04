import { type NextRequest, NextResponse } from 'next/server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/supabase/types';

/**
 * Middleware helper — refresca la sesión Supabase en cada request.
 * Será importado por src/middleware.ts (CAJA_5).
 *
 * EXCEPCIÓN RULE 5: No se importa @/lib/env porque el middleware
 * ejecuta en Edge Runtime donde @t3-oss/env-nextjs podría no estar
 * inicializado. Las NEXT_PUBLIC_ vars son seguras vía process.env.
 */
export async function updateSession(request: NextRequest): Promise<{
  supabaseResponse: NextResponse;
  user: import('@supabase/supabase-js').User | null;
}> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANTE: NO usar getSession() — getUser() hace la verificación contra Supabase Auth.
  // getSession() lee del JWT local sin verificar y es inseguro.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // TODO (CAJA_5): Agregar lógica de redirección según subscription_status:
  // trial | active → permitir acceso a (dashboard)
  // limbo → redirigir a página de pago
  // cancelled → redirigir a landing
  // No autenticado en ruta protegida → redirigir a /login

  return { supabaseResponse, user };
}
