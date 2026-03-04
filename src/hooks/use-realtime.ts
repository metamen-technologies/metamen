'use client';

import { useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { createRealtimeSubscription } from '@/lib/supabase/realtime';
import type { UseRealtimeConfig, UseRealtimeReturn } from '@/lib/supabase/realtime.types';

/**
 * Hook de React para recibir actualizaciones en tiempo real del dashboard.
 * Suscribe a notifications (INSERT), avatar_states (UPDATE) y wallets (UPDATE)
 * filtradas por el usuario autenticado.
 *
 * Uso:
 *   const { isConnected, lastError } = useRealtime({
 *     onNotification: (n) => toast(n.title),
 *     onAvatarStateChange: (state) => updateRadar(state),
 *     onWalletChange: (wallet) => updateBtcDisplay(wallet),
 *   });
 */
export function useRealtime(config: UseRealtimeConfig): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Guardar el config en un ref para que los callbacks dentro del efecto
  // siempre lean la versión más reciente sin recrear la suscripción.
  // Los refs se actualizan dentro de useEffect (antes del efecto principal)
  // para cumplir con la regla react-hooks/refs.
  const configRef = useRef(config);

  useEffect(() => {
    // Sincronizar el ref con el config actual en cada render.
    // Este efecto corre antes del efecto de suscripción.
    configRef.current = config;
  });

  useEffect(() => {
    const supabase = createClient();
    let unsubscribeFn: (() => void) | null = null;

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Sin usuario autenticado: no suscribir
      if (!user) {
        return;
      }

      const subscription = createRealtimeSubscription(supabase, {
        userId: user.id,
        onNotification: (payload) => {
          configRef.current.onNotification?.(payload);
        },
        onAvatarStateChange: (payload) => {
          configRef.current.onAvatarStateChange?.(payload);
        },
        onWalletChange: (payload) => {
          configRef.current.onWalletChange?.(payload);
        },
        onError: (error) => {
          setLastError(error);
          setIsConnected(false);
          configRef.current.onError?.(error);
        },
        onReconnect: () => {
          setIsConnected(true);
          setLastError(null);
        },
      });

      unsubscribeFn = subscription.unsubscribe;
      setIsConnected(true);
    }

    void subscribe();

    return () => {
      unsubscribeFn?.();
      setIsConnected(false);
    };
    // La suscripción se crea una sola vez al montar.
    // Los callbacks se leen desde configRef para estar siempre frescos.
  }, []);

  return { isConnected, lastError };
}
