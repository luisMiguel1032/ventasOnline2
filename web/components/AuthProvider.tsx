'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { loginAdmin, loginCustomer, registerCustomer } from '@/lib/api';
import {
  SESSION_EVENT,
  clearSession,
  readSession,
  saveSession,
} from '@/lib/session';
import type { AdminLoginInput, AuthResponse, RegisterInput, Session } from '@/lib/types';

type ViewMode = 'admin' | 'client';

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  isAdmin: boolean;
  adminMode: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  login: (email: string, password: string) => Promise<Session>;
  loginAsAdmin: (input: AdminLoginInput) => Promise<Session>;
  register: (input: RegisterInput) => Promise<Session>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(auth: AuthResponse): Session {
  return {
    ...auth,
    expiresAt: Date.now() + auth.expiresIn * 1000,
  };
}

const VIEW_MODE_KEY = 'arboldeventa.viewMode';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [viewMode, setViewModeState] = useState<ViewMode>('admin');

  useEffect(() => {
    const syncSession = () => setSession(readSession());
    const syncViewMode = () => {
      const saved = window.localStorage.getItem(VIEW_MODE_KEY);
      setViewModeState(saved === 'client' ? 'client' : 'admin');
    };

    syncSession();
    syncViewMode();
    setReady(true);

    window.addEventListener(SESSION_EVENT, syncSession);
    window.addEventListener('storage', syncSession);
    window.addEventListener('storage', syncViewMode);

    return () => {
      window.removeEventListener(SESSION_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('storage', syncViewMode);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await loginCustomer(email, password);
    const nextSession = toSession(auth);
    saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const loginAsAdmin = useCallback(async (input: AdminLoginInput) => {
    const auth = await loginAdmin(input);
    const nextSession = toSession(auth);
    saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const auth = await registerCustomer(input);
    const nextSession = toSession(auth);
    saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
    setViewModeState(mode);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    window.localStorage.removeItem(VIEW_MODE_KEY);
    setSession(null);
    setViewModeState('admin');
  }, []);

  const isAdmin = session?.accountType === 'ADMIN';
  const adminMode = isAdmin && viewMode === 'admin';

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      isAdmin,
      adminMode,
      viewMode,
      setViewMode,
      login,
      loginAsAdmin,
      register,
      logout,
    }),
    [session, ready, isAdmin, adminMode, viewMode, setViewMode, login, loginAsAdmin, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }

  return context;
}
