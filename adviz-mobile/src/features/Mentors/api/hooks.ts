import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { MentorProfileRead, MentorProfileUpdate, SlotRead, MentorListParams, ScheduleRead, ScheduleUpdate } from '../../../lib/types';

export const mentorKeys = {
  all: ['mentors'] as const,
  list: (params: MentorListParams) => [...mentorKeys.all, 'list', params] as const,
  detail: (id: string) => [...mentorKeys.all, 'detail', id] as const,
  availability: (id: string, from: string, to: string) => [...mentorKeys.all, 'availability', id, from, to] as const,
};

export function useMentors(params: MentorListParams) {
  return useInfiniteQuery({
    queryKey: mentorKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      api.get<MentorProfileRead[]>('/mentors/', { params: { ...params, page: pageParam } }).then((r) => r.data),
    getNextPageParam: (lastPage, allPages) => lastPage.length === 10 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

export function useMentor(id: string) {
  return useQuery({
    queryKey: mentorKeys.detail(id),
    queryFn: () => api.get<MentorProfileRead>(`/mentors/${id}`).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useMentorAvailability(id: string, from: string, to: string) {
  return useQuery({
    queryKey: mentorKeys.availability(id, from, to),
    queryFn: () =>
      api.get<SlotRead[]>(`/mentors/${id}/availability`, { params: { from, to } }).then((r) => r.data),
    staleTime: 0,
    enabled: !!id && !!from && !!to,
  });
}

export function useMentorMe() {
  return useQuery({
    queryKey: ['mentor-me'],
    queryFn: () => api.get<MentorProfileRead>('/mentor/me').then((r) => r.data),
  });
}

export function useUpdateMentorMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MentorProfileUpdate) =>
      api.put<MentorProfileRead>('/mentor/me', data).then((r) => r.data),
    onSuccess: (updated) => queryClient.setQueryData(['mentor-me'], updated),
  });
}

export function useSchedule() {
  return useQuery({
    queryKey: ['mentor-schedule'],
    queryFn: () => api.get<ScheduleRead>('/mentor/schedule').then((r) => r.data),
  });
}

export function useSaveSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleUpdate) =>
      api.put<ScheduleRead>('/mentor/schedule', data).then((r) => r.data),
    onSuccess: (updated) => queryClient.setQueryData(['mentor-schedule'], updated),
  });
}
