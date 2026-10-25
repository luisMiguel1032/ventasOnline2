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

import { loginCustomer, registerCustomer } from '@/lib/api';
import {
  SESSION_EVENT,
  clearSession,
  readSession,
  saveSession,
} from '@/lib/session';
import type { AuthResponse, RegisterInput, Session } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<Session>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(readSession());

    sync();
    setReady(true);

    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await loginCustomer(email, password);
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

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, ready, login, register, logout }),
    [session, ready, login, register, logout],
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
