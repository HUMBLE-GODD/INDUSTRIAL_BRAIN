import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginCredentials } from '../api/types';
import { TokenStorage } from '../api/storage';
import { ApiClient } from '../api/client';
import { config } from '../api/config';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOffline: boolean;
  isSessionExpired: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  toggleOfflineMode: () => void;
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isOffline: false,
  isSessionExpired: false,
  login: async () => {},
  logout: async () => {},
  toggleOfflineMode: () => {},
  dismissSessionExpired: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    async function loadStoredAuth() {
      try {
        const storedToken = await TokenStorage.getToken();
        const storedUser = await TokenStorage.getUser();
        const offlineSetting = await TokenStorage.getOfflineMode();

        if (isMounted) {
          setIsOffline(offlineSetting);
          config.setOfflineMode(offlineSetting);

          if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
          }
        }
      } catch (err) {
        // Failed to load
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStoredAuth();

    // Subscribe to 401 auth expired events
    const unsubscribe = ApiClient.onAuthExpired(() => {
      if (isMounted) {
        setIsSessionExpired(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.login(credentials);
      setToken(res.access_token);
      setUser(res.user);
      setIsSessionExpired(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await ApiClient.logout();
      setToken(null);
      setUser(null);
      setIsSessionExpired(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleOfflineMode = useCallback(async () => {
    const nextVal = !isOffline;
    setIsOffline(nextVal);
    config.setOfflineMode(nextVal);
    await TokenStorage.saveOfflineMode(nextVal);
  }, [isOffline]);

  const dismissSessionExpired = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isOffline,
        isSessionExpired,
        login,
        logout,
        toggleOfflineMode,
        dismissSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
