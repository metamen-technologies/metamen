import { type RealtimeChannel } from '@supabase/supabase-js';

import type {
  OnAvatarStateChange,
  OnNotification,
  OnWalletChange,
  RealtimeAvatarState,
  RealtimeNotification,
  RealtimeSubscriptionConfig,
  RealtimeWallet,
} from '@/lib/supabase/realtime.types';

// Structural type: solo los métodos de SupabaseClient que Realtime necesita.
// Evita incompatibilidades de genéricos con el placeholder Database.
// Se reemplazará con SupabaseClient<Database> cuando CAJA_3 genere los tipos reales.
export interface RealtimeCapableClient {
  channel(name: string, opts?: Record<string, unknown>): RealtimeChannel;
  removeChannel(channel: RealtimeChannel): Promise<'ok' | 'timed out' | 'error'>;
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
  channel: RealtimeChannel;
}

/**
 * Crea una suscripción a Supabase Realtime para las 3 tablas críticas:
 * notifications (INSERT), avatar_states (UPDATE), wallets (UPDATE).
 *
 * Filtra por user_id para que cada cliente solo reciba sus propios datos.
 * Devuelve un objeto con unsubscribe() para cleanup.
 *
 * NO crear el cliente Supabase internamente — recibirlo como parámetro.
 */
export function createRealtimeSubscription(
  supabaseClient: RealtimeCapableClient,
  config: RealtimeSubscriptionConfig,
): RealtimeSubscription {
  const { userId, onNotification, onAvatarStateChange, onWalletChange, onError, onReconnect } =
    config;

  const channelName = `user-realtime-${userId}`;

  const channel = supabaseClient
    .channel(channelName)
    // notifications — evento INSERT: nueva notificación para el usuario
    .on<RealtimeNotification>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onNotification) {
          onNotification(payload.new);
        }
      },
    )
    // avatar_states — evento UPDATE: vectores, HP, nivel o racha cambiaron
    .on<RealtimeAvatarState>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'avatar_states',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onAvatarStateChange) {
          onAvatarStateChange(payload.new);
        }
      },
    )
    // wallets — evento UPDATE: balance BTC o earned cambiaron
    .on<RealtimeWallet>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onWalletChange) {
          onWalletChange(payload.new);
        }
      },
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (onError && err) {
          onError(err);
        }
        if (onReconnect) {
          onReconnect();
        }
      }

      if (status === 'CLOSED') {
        // Canal cerrado — puede ser por unsubscribe() o pérdida de conexión
        console.info(`[realtime] canal ${channelName} cerrado`);
      }
    });

  return {
    unsubscribe: () => {
      void supabaseClient.removeChannel(channel);
    },
    channel,
  };
}

// Re-exportar los tipos de callback para conveniencia de los consumidores
export type { OnNotification, OnAvatarStateChange, OnWalletChange };
