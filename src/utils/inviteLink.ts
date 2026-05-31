import { Platform } from 'react-native';
import { env } from '../config/env';

function resolveAppBaseUrl(): string {
  if (env.appUrl) {
    return env.appUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:8081';
}

export function buildSetPasswordLink(inviteId: string): string {
  const base = resolveAppBaseUrl();
  return `${base}/set-password?inviteId=${encodeURIComponent(inviteId)}`;
}
