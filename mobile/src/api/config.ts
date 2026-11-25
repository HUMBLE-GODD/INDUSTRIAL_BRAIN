import { Platform } from 'react-native';

// Default URLs depending on environment
const DEFAULT_LOCAL_URL = Platform.select({
  android: 'http://10.0.2.2:8000',
  default: 'http://localhost:8000',
});

// Config state
let customBaseUrl: string | null = null;
let forceOfflineMode = false;

export const config = {
  /**
   * The base URL for the backend API, prioritizing:
   * 1. User runtime custom override (saved in settings)
   * 2. EXPO_PUBLIC_API_URL environment variable
   * 3. Platform default localhost
   */
  getBaseUrl(): string {
    if (customBaseUrl && customBaseUrl.trim()) {
      return customBaseUrl.trim().replace(/\/+$/, '');
    }
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, '');
    }
    return DEFAULT_LOCAL_URL;
  },

  setCustomBaseUrl(url: string | null) {
    customBaseUrl = url;
  },

  isOfflineMode(): boolean {
    return forceOfflineMode;
  },

  setOfflineMode(offline: boolean) {
    forceOfflineMode = offline;
  },

  apiTimeoutMs: 8000,
  apiVersionPrefix: '/api/v1',
};
