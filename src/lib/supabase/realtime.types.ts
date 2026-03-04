// Tipos temporales para las tablas monitoreadas por Supabase Realtime.
// Se reemplazarán cuando se generen los tipos de Supabase (tarea 02.6.6)
// y las migraciones de CAJA_3 estén aplicadas.

// --- notifications ---
export type NotificationType =
  | 'task_completed'
  | 'level_up'
  | 'streak_milestone'
  | 'health_warning'
  | 'health_critical'
  | 'avatar_died'
  | 'image_ready'
  | 'trial_expiring'
  | 'payment_failed'
  | 'general';

export interface RealtimeNotification {
  readonly id: string; // UUID
  readonly user_id: string; // UUID
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly is_read: boolean; // columna DB: is_read (02_adrs 4.2)
  readonly created_at: string; // ISO-8601
}

// --- avatar_states (campos relevantes para Realtime) ---
// overall_score NO se incluye porque puede ser un campo calculado
// que no existe como columna materializada. Si CAJA_3 lo materializa, agregar.
export interface RealtimeAvatarState {
  readonly user_id: string;
  readonly health_points: number; // 0-14
  readonly current_level: number; // 1-12
  readonly aura_lvl: number; // 0.00-50.00
  readonly jawline_lvl: number; // 0.00-50.00
  readonly wealth_lvl: number; // 0.00-50.00
  readonly physique_lvl: number; // 0.00-50.00
  readonly social_lvl: number; // 0.00-50.00
  readonly env_lvl: number; // 1-10
  readonly streak_days: number;
}

// --- wallets (campos relevantes para Realtime) ---
export interface RealtimeWallet {
  readonly user_id: string;
  readonly btc_balance: number;
  readonly today_earned: number;
  readonly daily_cap: number; // siempre 2000
}

// Tipo union para las tablas monitoreadas
export type RealtimeTable = 'notifications' | 'avatar_states' | 'wallets';

// Callback types
export type OnNotification = (payload: RealtimeNotification) => void;
export type OnAvatarStateChange = (payload: RealtimeAvatarState) => void;
export type OnWalletChange = (payload: RealtimeWallet) => void;

export interface RealtimeSubscriptionConfig {
  readonly userId: string;
  readonly onNotification?: OnNotification;
  readonly onAvatarStateChange?: OnAvatarStateChange;
  readonly onWalletChange?: OnWalletChange;
  readonly onError?: (error: Error) => void;
  readonly onReconnect?: () => void;
}

// Config para el hook de React (sin userId — se obtiene internamente)
export interface UseRealtimeConfig {
  readonly onNotification?: OnNotification;
  readonly onAvatarStateChange?: OnAvatarStateChange;
  readonly onWalletChange?: OnWalletChange;
  readonly onError?: (error: Error) => void;
}

// Return type del hook
export interface UseRealtimeReturn {
  readonly isConnected: boolean;
  readonly lastError: Error | null;
}
