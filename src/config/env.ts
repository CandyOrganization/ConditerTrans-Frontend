const trimTrailingSlash = (url: string) => url.replace(/\/$/, '');

const wsToHttp = (wsUrl: string) => wsUrl.replace(/^ws/i, 'http');

/**
 * URL сервисов задаются в `.env.development` / `.env.production`.
 * Активный `.env` переключается: npm run env:local | env:prod
 *
 * Expo подхватывает только переменные с префиксом EXPO_PUBLIC_.
 */
export const env = {
  appEnv:
    process.env.EXPO_PUBLIC_APP_ENV ??
    (__DEV__ ? 'development' : 'production'),

  /** ConditerTrans Backend API (auth, users, orders…) */
  apiUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  ),

  /** Logistic Service — WebSocket GPS-трекинг (через nginx: /logistic-service) */
  trackingWsUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_TRACKING_WS_URL ??
      process.env.EXPO_PUBLIC_WS_URL ??
      'ws://localhost/logistic-service',
  ),

  /** URL фронтенда для ссылок-приглашений */
  appUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_APP_URL ?? 'http://localhost:8081',
  ),
} as const;

export const trackingHttpUrl = trimTrailingSlash(wsToHttp(env.trackingWsUrl));
