import { renderHook, waitFor } from '@testing-library/react-native';
import { useCreateSession, useCancelSession, useCreatePayment } from '../api/hooks';
import { api } from '../../../lib/api';
import { createQueryWrapper } from '../../../lib/__tests__/test-utils';

jest.mock('../../../lib/api', () => ({ api: { post: jest.fn(), get: jest.fn() } }));

const session = {
  id: 's1',
  mentor_id: 'm1',
  mentee_id: 'u1',
  scheduled_start: '2026-06-01T10:00:00Z',
  scheduled_end: '2026-06-01T11:00:00Z',
  status: 'scheduled',
  topic: 'React',
  agenda: null,
  price_eur: '5.00',
  is_paid: false,
  idempotency_key: null,
  started_at: null,
  ended_at: null,
  recording_url: null,
  created_at: '2026-05-01T00:00:00Z',
  cancelled_at: null,
  cancel_reason: null,
};

test('useCreateSession calls POST /sessions/', async () => {
  (api.post as jest.Mock).mockResolvedValue({ data: session });
  const { result } = renderHook(() => useCreateSession(), { wrapper: createQueryWrapper() });
  result.current.mutate({
    mentor_id: 'm1',
    mentee_id: 'u1',
    scheduled_start: '2026-06-01T10:00:00Z',
    scheduled_end: '2026-06-01T11:00:00Z',
    topic: 'React',
    price_eur: '5.00',
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(api.post).toHaveBeenCalledWith('/sessions/', expect.any(Object), expect.any(Object));
});

test('useCreatePayment calls POST /payments/sessions/:id', async () => {
  (api.post as jest.Mock).mockResolvedValue({ data: { client_secret: 'pi_secret', payment_id: 'pay1' } });
  const { result } = renderHook(() => useCreatePayment(), { wrapper: createQueryWrapper() });
  result.current.mutate('s1');
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.client_secret).toBe('pi_secret');
  expect(api.post).toHaveBeenCalledWith('/payments/sessions/s1', null, expect.any(Object));
});

test('useCreatePayment handles error correctly', async () => {
  (api.post as jest.Mock).mockRejectedValue(new Error('Payment failed'));
  const { result } = renderHook(() => useCreatePayment(), { wrapper: createQueryWrapper() });
  result.current.mutate('s1');
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error).toBeTruthy();
});

test('useCancelSession calls POST /sessions/:id/cancel', async () => {
  const cancelled = { ...session, status: 'cancelled' };
  (api.post as jest.Mock).mockResolvedValue({ data: cancelled });
  const { result } = renderHook(() => useCancelSession(), { wrapper: createQueryWrapper() });
  result.current.mutate({ sessionId: 's1', body: {} });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(api.post).toHaveBeenCalledWith('/sessions/s1/cancel', {});
});
