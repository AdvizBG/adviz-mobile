import { useAuthStore } from '../auth';
import type { User } from '../../lib/types';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  mergeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  multiMerge: jest.fn(() => Promise.resolve()),
  flushGetRequests: jest.fn(),
}));

const mockUser: User = {
  id: 'u1',
  username: 'ivan',
  full_name: 'Ivan Petrov',
  email: 'ivan@example.com',
  scopes: ['sessions:read'],
};

beforeEach(() => useAuthStore.getState().clearAuth());

test('setAuth stores user and token', () => {
  useAuthStore.getState().setAuth(mockUser, 'tok123');
  const state = useAuthStore.getState();
  expect(state.token).toBe('tok123');
  expect(state.user?.email).toBe('ivan@example.com');
  expect(state.scopes).toContain('sessions:read');
});

test('clearAuth resets state', () => {
  useAuthStore.getState().setAuth(mockUser, 'tok123');
  useAuthStore.getState().clearAuth();
  expect(useAuthStore.getState().token).toBeNull();
  expect(useAuthStore.getState().user).toBeNull();
});
