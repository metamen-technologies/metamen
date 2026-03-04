// ============================================================================
// METAMEN100 — Auto-generated Supabase Types
// ============================================================================
// Este archivo es generado automaticamente por: pnpm db:types
// NO EDITAR MANUALMENTE — los cambios se sobreescribiran.
//
// Para regenerar despues de cambios en el schema:
//   1. Asegurar que Supabase local esta corriendo: pnpm db:start
//   2. Ejecutar: pnpm db:types
//
// Tablas esperadas (se crean en CAJA_3, 13 tablas):
//   profiles, avatar_states, wallets, subscriptions,
//   daily_tasks, daily_logs, store_items, inventory,
//   tool_progress, image_generation_queue, notifications,
//   activity_logs, idempotency_keys
//
// ENUMs esperados (se crean en CAJA_3):
//   Fuente canonica: las migraciones de CAJA_3 definiran la lista final.
//   Referencia combinada de 04_data_model + 02_adrs (9 ENUMs):
//   task_status, task_category (17 vals), subscription_status,
//   item_rarity, image_gen_status, notification_type,
//   tool_type (9 vals), day_status, store_item_type
//
// Funciones PG esperadas (CAJA_3+):
//   fn_create_user_records, fn_complete_task_transaction,
//   fn_process_judgement_night, fn_apply_vector_degradation,
//   fn_process_avatar_death, fn_purchase_item_transaction,
//   fn_spend_btc_safe, fn_calculate_btc_multiplier,
//   fn_get_or_create_idempotency_key, fn_cleanup_expired_idempotency_keys,
//   fn_wallets_reset_daily
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
