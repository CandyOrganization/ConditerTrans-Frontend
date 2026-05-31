import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '../types';

const AUTH_STORAGE_KEY = 'translogistic_auth';

export async function getStoredAuth(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const auth = await getStoredAuth();
  return auth?.accessToken ?? null;
}

export async function saveAuth(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}
