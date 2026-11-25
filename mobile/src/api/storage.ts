import * as SecureStore from 'expo-secure-store';
import { User } from './types';

const TOKEN_KEY = 'ib_auth_token';
const USER_KEY = 'ib_user_profile';
const OFFLINE_KEY = 'ib_offline_mode';
const CUSTOM_URL_KEY = 'ib_custom_url';

// In-memory fallback cache for environments where SecureStore is unavailable
// (such as React Native Web or unit tests)
const memoryStore = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    if (typeof SecureStore.isAvailableAsync === 'function') {
      return await SecureStore.isAvailableAsync();
    }
    return false;
  } catch {
    return false;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  memoryStore.set(key, value);
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (err) {
    // Fall back silently to memoryStore
  }
}

async function getItem(key: string): Promise<string | null> {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      const stored = await SecureStore.getItemAsync(key);
      if (stored !== null) {
        memoryStore.set(key, stored);
        return stored;
      }
    }
  } catch {
    // Fallback to memory
  }
  return memoryStore.get(key) ?? null;
}

async function deleteItem(key: string): Promise<void> {
  memoryStore.delete(key);
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    // Ignore error
  }
}

export const TokenStorage = {
  async saveToken(token: string): Promise<void> {
    await setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await getItem(TOKEN_KEY);
  },

  async clearToken(): Promise<void> {
    await deleteItem(TOKEN_KEY);
  },

  async saveUser(user: User): Promise<void> {
    await setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async clearUser(): Promise<void> {
    await deleteItem(USER_KEY);
  },

  async saveCustomUrl(url: string | null): Promise<void> {
    if (url) {
      await setItem(CUSTOM_URL_KEY, url);
    } else {
      await deleteItem(CUSTOM_URL_KEY);
    }
  },

  async getCustomUrl(): Promise<string | null> {
    return await getItem(CUSTOM_URL_KEY);
  },

  async saveOfflineMode(enabled: boolean): Promise<void> {
    await setItem(OFFLINE_KEY, enabled ? 'true' : 'false');
  },

  async getOfflineMode(): Promise<boolean> {
    const val = await getItem(OFFLINE_KEY);
    return val === 'true';
  },

  async clearAll(): Promise<void> {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
  },
};
