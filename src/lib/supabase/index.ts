// Re-exports de tipos para conveniencia.
//
// IMPORTANTE: NO re-exportar los clientes desde aquí.
// Cada consumidor debe importar explícitamente desde el archivo correcto
// para evitar importaciones ambiguas:
//
//   Client Components → import { createClient } from '@/lib/supabase/client'
//   Server Components/Actions → import { createClient } from '@/lib/supabase/server'
//   Middleware → import { updateSession } from '@/lib/supabase/middleware'
//   Webhooks/Crons/Admin → import { createAdminClient } from '@/lib/supabase/admin'
export type { Database } from './types';
