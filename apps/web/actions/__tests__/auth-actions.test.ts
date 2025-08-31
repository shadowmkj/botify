import { signOut } from '../auth-actions';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

describe('Auth Actions', () => {
  it('should sign out a user successfully', async () => {
    (auth.api.signOut as jest.Mock).mockResolvedValue({ success: true });
    (headers as jest.Mock).mockResolvedValue(new Headers());

    const result = await signOut();

    expect(result.status).toBe(true);
    expect(result.data).toEqual({ success: true });
  });

  it('should handle sign out failure', async () => {
    const error = new Error('Sign out failed');
    (auth.api.signOut as jest.Mock).mockRejectedValue(error);
    (headers as jest.Mock).mockResolvedValue(new Headers());

    const result = await signOut();

    expect(result.status).toBe(false);
    expect(result.error).toBe(error);
  });
});
