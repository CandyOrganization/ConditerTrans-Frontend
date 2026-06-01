const trimTrailingSlash = (url: string) => url.replace(/\/$/, '');

const wsToHttp = (wsUrl: string) => wsUrl.replace(/^ws/i, 'http');

/** На проде с HTTPS API всегда используем wss, иначе ws редиректится на просроченный/битый TLS. */
function normalizeTrackingWsUrl(wsUrl: string, apiUrl: string): string {
  const trimmed = trimTrailingSlash(wsUrl);

  if (apiUrl.startsWith('https://') && trimmed.startsWith('ws://')) {
    return `wss://${trimmed.slice('ws://'.length)}`;
  }

  return trimmed;
}

/**
 * URL сервисов задаются в `..env.development` / `.env.production`.
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
  trackingWsUrl: normalizeTrackingWsUrl(
    process.env.EXPO_PUBLIC_TRACKING_WS_URL ??
      process.env.EXPO_PUBLIC_WS_URL ??
      'ws://localhost/logistic-service',
    process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  ),

  /** URL фронтенда для ссылок-приглашений */
  appUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_APP_URL ?? 'http://localhost:8081',
  ),
} as const;

export const trackingHttpUrl = trimTrailingSlash(wsToHttp(env.trackingWsUrl));
