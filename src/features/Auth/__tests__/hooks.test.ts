import { renderHook, waitFor } from '@testing-library/react-native';
import { useLogin } from '../api/hooks';
import { api } from '../../../lib/api';
import { createQueryWrapper } from '../../../lib/__tests__/test-utils';

jest.mock('../../../lib/api', () => ({ api: { post: jest.fn(), get: jest.fn() } }));
jest.mock('../../../store/auth', () => ({
  useAuthStore: (selector: (s: { setAuth: jest.Mock }) => unknown) =>
    selector({ setAuth: jest.fn() }),
}));

const mockUser = {
  id: 'u1',
  username: 'ivan',
  full_name: 'Ivan',
  email: 'ivan@test.com',
  scopes: ['sessions:read'],
};

test('useLogin stores auth on success', async () => {
  (api.post as jest.Mock).mockResolvedValue({ data: { access_token: 'tok' } });
  (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

  const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() });
  result.current.mutate({ email: 'ivan@test.com', password: 'pass' });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
