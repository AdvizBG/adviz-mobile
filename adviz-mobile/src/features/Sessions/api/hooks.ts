import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type {
  SessionRead, SessionCreate, SessionCancel,
  ReviewCreate, ReviewRead, PaymentIntentResponse,
} from '../../../lib/types';

export const sessionKeys = {
  all: ['sessions'] as const,
  mine: () => [...sessionKeys.all, 'mine'] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
  mentorSessions: (status?: string) => [...sessionKeys.all, 'mentor', status] as const,
};

export function useMySessions() {
  return useQuery({
    queryKey: sessionKeys.mine(),
    queryFn: () => api.get<SessionRead[]>('/me/sessions').then((r) => r.data),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => api.get<SessionRead>(`/sessions/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useSessionPaidStatus(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...sessionKeys.detail(sessionId), 'paid-status'],
    queryFn: () => api.get<SessionRead>(`/sessions/${sessionId}`).then((r) => r.data),
    enabled,
    refetchInterval: (query) => {
      if (query.state.data?.is_paid) return false;
      return 2000;
    },
    staleTime: 0,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SessionCreate) =>
      api.post<SessionRead>('/sessions/', data, {
        headers: { 'Idempotency-Key': `${data.mentor_id}-${data.scheduled_start}-${Date.now()}` },
      }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.mine() }),
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<PaymentIntentResponse>(`/payments/sessions/${sessionId}`, null, {
        headers: { 'Idempotency-Key': `pay-${sessionId}` },
      }).then((r) => r.data),
  });
}

export function useCancelSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, body }: { sessionId: string; body: SessionCancel }) =>
      api.post<SessionRead>(`/sessions/${sessionId}/cancel`, body).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(sessionKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: sessionKeys.mine() });
    },
  });
}

export function useCreateReview() {
  return useMutation({
    mutationFn: ({ sessionId, body }: { sessionId: string; body: ReviewCreate }) =>
      api.post<ReviewRead>(`/sessions/${sessionId}/review`, body).then((r) => r.data),
  });
}

export function useMentorSessions(status?: string) {
  return useQuery({
    queryKey: sessionKeys.mentorSessions(status),
    queryFn: () =>
      api.get<SessionRead[]>('/mentor/sessions', { params: status ? { status } : undefined }).then((r) => r.data),
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<SessionRead>(`/sessions/${sessionId}/start`).then((r) => r.data),
    onSuccess: (updated) => queryClient.setQueryData(sessionKeys.detail(updated.id), updated),
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<SessionRead>(`/sessions/${sessionId}/end`).then((r) => r.data),
    onSuccess: (updated) => queryClient.setQueryData(sessionKeys.detail(updated.id), updated),
  });
}
