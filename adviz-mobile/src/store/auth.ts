import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { tokenStore } from '../lib/token';
import type { User } from '../lib/types';

interface AuthState {
  user: User | null;
  scopes: string[];
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

// Token lives in SecureStore (max 2 KB on iOS — fits a JWT).
// User profile + scopes go to AsyncStorage (no size ceiling).
// Two separate persist slices avoids hitting the 2 KB iOS SecureStore limit
// as the User object grows with future fields.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      scopes: [],
      token: null,
      setAuth: (user, token) => {
        tokenStore.set(token);
        set({ user, scopes: user.scopes, token });
      },
      clearAuth: () => {
        tokenStore.set(null);
        set({ user: null, scopes: [], token: null });
      },
    }),
    {
      name: 'auth-user',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user, scopes: s.scopes }),
      onRehydrateStorage: () => (state) => {
        // token is excluded from partialize — load it from SecureStore at app init
        // via loadPersistedToken(). We only register the clearAuth callback here.
        tokenStore.setClearAuth(() => state && state.clearAuth());
      },
    },
  ),
);

// Token persisted separately in SecureStore
const TOKEN_KEY = 'auth-token';
export async function persistToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function loadPersistedToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearPersistedToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
