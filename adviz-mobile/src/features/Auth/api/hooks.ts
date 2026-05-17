import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../../../lib/types';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<LoginResponse>('/auth/login', data);
      const meRes = await api.get<User>('/users/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      return {
        token: res.data.access_token,
        user: meRes.data,
        remaining_attempts: res.data.remaining_attempts,
      };
    },
    onSuccess: ({ user, token }) => setAuth(user, token),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      api.post<User>('/users', data).then((r) => r.data),
  });
}
