import { useRedisAuthState, deleteSessionFromRedis } from '../src/auth/redis-auth';

jest.mock('baileys', () => ({
  BufferJSON: {
    replacer: jest.fn((_k, v) => v),
    reviver: jest.fn((_k, v) => v),
  },
  initAuthCreds: jest.fn(() => ({})),
  proto: {
    Message: {
      AppStateSyncKeyData: {
        fromObject: jest.fn((obj) => obj),
      },
    },
  },
}));

describe('wserver redis-auth', () => {
  let mockRedis: any;

  beforeEach(() => {
    const store: Record<string, string> = {};
    mockRedis = {
      get: jest.fn(async (key: string) => store[key] || null),
      set: jest.fn(async (key: string, val: string) => {
        store[key] = val;
      }),
      del: jest.fn(async (key: string | string[]) => {
        if (Array.isArray(key)) {
          key.forEach((k) => delete store[k]);
        } else {
          delete store[key];
        }
      }),
      scan: jest.fn(async (cursor: number) => {
        const matching = Object.keys(store).filter((k) => k.startsWith('sess_123:'));
        return ['0', matching];
      }),
    };
  });

  describe('useRedisAuthState', () => {
    it('should initialize auth state and save creds to redis', async () => {
      const authState = await useRedisAuthState(mockRedis as any, 'sess_123');
      expect(authState.state.creds).toBeDefined();
      expect(typeof authState.saveCreds).toBe('function');

      await authState.saveCreds();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'sess_123:creds.json',
        expect.any(String)
      );
    });

    it('should handle keys get and set operations', async () => {
      const authState = await useRedisAuthState(mockRedis as any, 'sess_123');

      // Set keys
      await authState.state.keys.set({
        'pre-key': {
          '1': { key: 'sample-key' } as any,
          '2': null as any,
        },
      });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'sess_123:pre-key-1.json',
        expect.any(String)
      );
      expect(mockRedis.del).toHaveBeenCalledWith('sess_123:pre-key-2.json');

      // Set store value for read
      await mockRedis.set('sess_123:pre-key-1.json', JSON.stringify({ key: 'sample-key' }));

      // Get keys
      const fetched = await authState.state.keys.get('pre-key', ['1']);
      expect(fetched['1']).toBeDefined();
    });
  });

  describe('deleteSessionFromRedis', () => {
    it('should scan and delete all keys matching the session', async () => {
      await mockRedis.set('sess_123:creds.json', '{}');
      await mockRedis.set('sess_123:pre-key-1.json', '{}');

      await deleteSessionFromRedis(mockRedis as any, 'sess_123');
      expect(mockRedis.scan).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.arrayContaining(['sess_123:creds.json', 'sess_123:pre-key-1.json'])
      );
    });
  });
});
