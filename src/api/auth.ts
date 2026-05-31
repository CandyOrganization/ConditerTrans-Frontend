import type { AuthUser, LoginDto, SetPasswordDto, TokensResponse } from '../types';
import { fetchCurrentUser } from './users';
import { apiRequest } from './client';
import { clearAuth, getStoredAuth, saveAuth } from './tokenStorage';

export { getAccessToken, getStoredAuth } from './tokenStorage';

export async function isAuthenticated(): Promise<boolean> {
  return (await getStoredAuth()) !== null;
}

async function enrichAuthUser(base: AuthUser): Promise<AuthUser> {
  try {
    const profile = await fetchCurrentUser();
    return {
      ...base,
      id: profile.id,
      email: profile.email,
      userRole: profile.userRole,
      isAdmin: profile.isAdmin,
    };
  } catch {
    return base;
  }
}

async function authenticateWithTokens(
  tokens: TokensResponse,
  emailFallback = '',
): Promise<AuthUser> {
  const baseUser: AuthUser = {
    email: emailFallback,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

  await saveAuth(baseUser);
  const user = await enrichAuthUser(baseUser);
  await saveAuth(user);
  return user;
}

export async function login(credentials: LoginDto): Promise<AuthUser> {
  const email = credentials.email.trim();
  const password = credentials.password;

  if (!email) {
    throw new Error('Email не может быть пустым');
  }

  if (password.length < 6) {
    throw new Error('Длина пароля должна быть не меньше 6 символов');
  }

  const tokens = await apiRequest<TokensResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  return authenticateWithTokens(tokens, email);
}

export async function setPassword(dto: SetPasswordDto): Promise<AuthUser> {
  const inviteId = dto.inviteId.trim();
  const password = dto.password;

  if (!inviteId) {
    throw new Error('Отсутствует идентификатор приглашения');
  }

  if (password.length < 6) {
    throw new Error('Длина пароля должна быть не меньше 6 символов');
  }

  const tokens = await apiRequest<TokensResponse>('/auth/set-password', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ inviteId, password }),
  });

  return authenticateWithTokens(tokens);
}

export async function refreshAuthProfile(): Promise<AuthUser | null> {
  const stored = await getStoredAuth();
  if (!stored) {
    return null;
  }

  const user = await enrichAuthUser(stored);
  await saveAuth(user);
  return user;
}

export async function logout(): Promise<void> {
  await clearAuth();
}
