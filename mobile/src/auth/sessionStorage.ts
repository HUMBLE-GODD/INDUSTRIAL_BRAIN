import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from '../lib/api/client';
import type { UserResponse } from '../lib/api/types';

function browserStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

async function readValue(key: string): Promise<string | null> {
  const storage = browserStorage();
  if (storage) return storage.getItem(key);
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string): Promise<void> {
  const storage = browserStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(key, value);
}

async function deleteValue(key: string): Promise<void> {
  const storage = browserStorage();
  if (storage) {
    storage.removeItem(key);
    return;
  }
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(key);
}

export async function readAccessToken(): Promise<string | null> {
  return readValue(AUTH_TOKEN_STORAGE_KEY);
}

export async function saveSession(token: string, user: UserResponse): Promise<void> {
  await Promise.all([
    writeValue(AUTH_TOKEN_STORAGE_KEY, token),
    writeValue(AUTH_USER_STORAGE_KEY, JSON.stringify(user)),
  ]);
}

export async function readSessionUser(): Promise<UserResponse | null> {
  const serialized = await readValue(AUTH_USER_STORAGE_KEY);
  if (!serialized) return null;
  try {
    const user = JSON.parse(serialized) as Partial<UserResponse>;
    if (typeof user.email !== 'string' || typeof user.id !== 'string') return null;
    return user as UserResponse;
  } catch {
    return null;
  }
}

export async function clearSavedSession(): Promise<void> {
  await Promise.all([
    deleteValue(AUTH_TOKEN_STORAGE_KEY),
    deleteValue(AUTH_USER_STORAGE_KEY),
  ]);
}
