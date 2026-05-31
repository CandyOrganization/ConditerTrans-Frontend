import { getAccessToken } from './tokenStorage';
import { env } from '../config/env';

export const API_BASE_URL = env.apiUrl;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  const fallback = response.statusText || 'Ошибка запроса';

  try {
    const data: unknown = await response.json();

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (Array.isArray(data)) {
      const messages = data
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'message' in item) {
            const message = (item as { message?: unknown }).message;
            return typeof message === 'string' ? message : null;
          }
          return null;
        })
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) {
        return messages.join('\n');
      }
    }

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;

      if (typeof record.title === 'string' && typeof record.detail === 'string') {
        return record.detail;
      }

      if (typeof record.error === 'string') {
        return record.error;
      }

      if (typeof record.message === 'string') {
        return record.message;
      }
    }
  } catch {
    // ignore JSON parse errors
  }

  return fallback;
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { auth?: boolean },
): Promise<T> {
  const useAuth = options?.auth !== false;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (useAuth && !headers.Authorization) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const { auth: _auth, ...fetchOptions } = options ?? {};

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockRequest<T>(data: T, ms = 300): Promise<T> {
  await delay(ms);
  return data;
}
