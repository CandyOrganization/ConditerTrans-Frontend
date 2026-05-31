import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import type { AuthUser, LoginDto, SetPasswordDto, UserRole } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userRole: UserRole | null;
  loading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  completeInvitation: (dto: SetPasswordDto) => Promise<void>;
  loginForTest: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await authApi.getStoredAuth();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }

      const enriched = await authApi.refreshAuthProfile();
      if (!cancelled) {
        setUser(enriched ?? stored);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginDto) => {
    const authUser = await authApi.login(credentials);
    setUser(authUser);
  }, []);

  const completeInvitation = useCallback(async (dto: SetPasswordDto) => {
    const authUser = await authApi.setPassword(dto);
    setUser(authUser);
  }, []);

  const loginForTest = useCallback(() => {
    setUser({
      email: 'test-driver@local.dev',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    const updated = await authApi.refreshAuthProfile();
    if (updated) {
      setUser(updated);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.isAdmin === true,
      userRole: user?.userRole ?? null,
      loading,
      login,
      completeInvitation,
      loginForTest,
      logout,
      refreshProfile,
    }),
    [user, loading, login, completeInvitation, loginForTest, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
