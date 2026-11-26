import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_IS_CONFIGURED, authApi, setAccessToken, setAuthExpiredHandler } from '../lib/api/client';
import type { UserResponse } from '../lib/api/types';
import { clearSavedSession, readAccessToken, readSessionUser, saveSession } from './sessionStorage';

type SessionContextValue = {
  token: string | null;
  user: UserResponse | null;
  isReady: boolean;
  signIn: (email: string, password: string, createAccount?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      if (!API_IS_CONFIGURED) {
        if (mounted) setIsReady(true);
        return;
      }
      try {
        const [savedToken, savedUser] = await Promise.all([readAccessToken(), readSessionUser()]);
        if (!mounted) return;
        if (savedToken) setAccessToken(savedToken);
        setToken(savedToken);
        setUser(savedUser);
      } catch {
        if (!mounted) return;
        setAccessToken(null);
        setToken(null);
        setUser(null);
      } finally {
        if (mounted) setIsReady(true);
      }
    };
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      void clearSavedSession().catch(() => undefined);
    });
    return () => setAuthExpiredHandler(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string, createAccount = false) => {
    const result = createAccount
      ? await authApi.register(email, password)
      : await authApi.login(email, password);
    try {
      await saveSession(result.access_token, result.user);
    } catch {
      // Keep the signed-in session usable if the platform cannot persist it.
    }
    setAccessToken(result.access_token);
    setToken(result.access_token);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    setAccessToken(null);
    setToken(null);
    setUser(null);
    try {
      await clearSavedSession();
    } catch {
      // A local storage failure should not keep the active session signed in.
    }
  }, []);

  const value = useMemo(() => ({ token, user, isReady, signIn, signOut }), [token, user, isReady, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}
