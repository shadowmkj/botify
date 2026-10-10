import {
  startWhatsAppSession,
  gracefulShutdown,
  reconnectAttempts,
  reconnectTimeouts,
  clearReconnectState,
  scheduleReconnect,
  MAX_RECONNECT_RETRIES,
} from '../src/lib/whatsapp';
import { sessions } from '../src/worker';

const mockEvListeners: Record<string, Function> = {};
const mockSock = {
  ev: {
    on: jest.fn((event: string, cb: Function) => {
      mockEvListeners[event] = cb;
    }),
  },
  profilePictureUrl: jest.fn().mockResolvedValue('https://example.com/pic.png'),
  user: { id: 'user_jid' },
  end: jest.fn(),
  ws: { isOpen: true },
};

jest.mock('baileys', () => ({
  __esModule: true,
  default: jest.fn(() => mockSock),
  Browsers: { macOS: jest.fn() },
  DisconnectReason: {
    loggedOut: 401,
    connectionReplaced: 440,
    restartRequired: 515,
  },
  fetchLatestBaileysVersion: jest.fn().mockResolvedValue({ version: [2, 3000, 1] }),
  makeCacheableSignalKeyStore: jest.fn((keys) => keys),
}));

jest.mock('baileys-antiban', () => ({
  wrapWithSessionStability: jest.fn((sock, opts) => {
    opts?.health?.onDegraded?.({});
    return sock;
  }),
  LidResolver: jest.fn(),
}));

jest.mock('qrcode-terminal', () => ({
  generate: jest.fn((qr, opts, cb) => cb('mock_qr_art')),
}));

jest.mock('@repo/redis', () => ({
  redisOptions: jest.fn(() => ({})),
  redis: {
    publish: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock('../src/auth/redis-auth', () => ({
  useRedisAuthState: jest.fn().mockResolvedValue({
    state: { creds: {}, keys: {} },
    saveCreds: jest.fn().mockResolvedValue(undefined),
  }),
  deleteSessionFromRedis: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/lib/helper', () => ({
  updateDeviceStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/autoreply', () => jest.fn());

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    addBulk: jest.fn().mockResolvedValue([]),
  })),
  Worker: jest.fn().mockImplementation(() => ({})),
}));

describe('wserver whatsapp session management', () => {
  beforeEach(() => {
    sessions.clear();
    clearReconnectState('+919999999999');
    jest.clearAllMocks();
  });

  afterEach(() => {
    gracefulShutdown();
  });

  it('should start a new whatsapp session and register event listeners', async () => {
    const sock = await startWhatsAppSession('+919999999999');
    expect(sock).toBe(mockSock);
    expect(sessions.has('+919999999999')).toBe(true);
    expect(mockEvListeners['connection.update']).toBeDefined();
    expect(mockEvListeners['creds.update']).toBeDefined();
    expect(mockEvListeners['messages.upsert']).toBeDefined();

    const autoreplyMock = require('../src/autoreply');
    mockEvListeners['messages.upsert']({ messages: [] });
    expect(autoreplyMock).toHaveBeenCalled();
    mockEvListeners['creds.update']();
  });

  it('should reuse existing open session if not from job', async () => {
    sessions.set('+919999999999', mockSock as any);
    const sock = await startWhatsAppSession('+919999999999', false);
    expect(sock).toBe(mockSock);
  });

  it('should handle QR code generation in connection.update', async () => {
    await startWhatsAppSession('+919999999999');
    const updateHandler = mockEvListeners['connection.update'];

    await updateHandler({ qr: 'mock_qr_string', connection: 'connecting' });
    const { redis } = require('@repo/redis');
    expect(redis.publish).toHaveBeenCalledWith(
      'qr:+919999999999',
      expect.stringContaining('mock_qr_string')
    );
  });

  it('should handle connection.update OPEN event and fetch profile pic', async () => {
    reconnectAttempts.set('+919999999999', 3);
    await startWhatsAppSession('+919999999999');
    const updateHandler = mockEvListeners['connection.update'];

    await updateHandler({ connection: 'open' });
    const { updateDeviceStatus } = require('../src/lib/helper');
    expect(updateDeviceStatus).toHaveBeenCalledWith('+919999999999', 'Connected');
    expect(reconnectAttempts.has('+919999999999')).toBe(false);
  });

  it('should handle connection.update loggedOut CLOSE event', async () => {
    await startWhatsAppSession('+919999999999');
    const updateHandler = mockEvListeners['connection.update'];

    await updateHandler({
      connection: 'close',
      lastDisconnect: {
        error: { output: { statusCode: 401 } },
      },
    });

    const { deleteSessionFromRedis } = require('../src/auth/redis-auth');
    expect(deleteSessionFromRedis).toHaveBeenCalled();
    expect(sessions.has('+919999999999')).toBe(false);
  });

  it('should handle connection.update connectionReplaced CLOSE event', async () => {
    await startWhatsAppSession('+919999999999');
    const updateHandler = mockEvListeners['connection.update'];

    await updateHandler({
      connection: 'close',
      lastDisconnect: {
        error: { output: { statusCode: 440 } },
      },
    });

    const { updateDeviceStatus } = require('../src/lib/helper');
    expect(updateDeviceStatus).toHaveBeenCalledWith('+919999999999', 'Disconnected');
  });

  it('should handle connection.update restartRequired CLOSE event', async () => {
    await startWhatsAppSession('+919999999999');
    const updateHandler = mockEvListeners['connection.update'];

    await updateHandler({
      connection: 'close',
      lastDisconnect: {
        error: { output: { statusCode: 515 } },
      },
    });

    expect(reconnectAttempts.get('+919999999999')).toBe(1);
    expect(reconnectTimeouts.has('+919999999999')).toBe(true);
  });

  it('should handle connection.update generic disconnect with exponential backoff', async () => {
    await startWhatsAppSession('+919999999999');
    const updateHandler = mockEvListeners['connection.update'];

    await updateHandler({
      connection: 'close',
      lastDisconnect: {
        error: { output: { statusCode: 500 } },
      },
    });

    expect(reconnectAttempts.get('+919999999999')).toBe(1);
    expect(reconnectTimeouts.has('+919999999999')).toBe(true);
  });

  it('should stop reconnecting and mark device Disconnected when reaching MAX_RECONNECT_RETRIES', async () => {
    reconnectAttempts.set('+919999999999', MAX_RECONNECT_RETRIES);

    scheduleReconnect('+919999999999', false);

    const { updateDeviceStatus } = require('../src/lib/helper');
    const { redis } = require('@repo/redis');

    expect(updateDeviceStatus).toHaveBeenCalledWith('+919999999999', 'Disconnected');
    expect(redis.publish).toHaveBeenCalledWith(
      'qr:+919999999999',
      JSON.stringify({ event: 'DISCONNECTED', error: 'Max reconnect attempts reached' })
    );
    expect(reconnectAttempts.has('+919999999999')).toBe(false);
    expect(reconnectTimeouts.has('+919999999999')).toBe(false);
  });

  it('should handle gracefulShutdown and clean up sessions and reconnect timeouts', () => {
    sessions.set('+919999999999', mockSock as any);
    reconnectAttempts.set('+919999999999', 2);
    reconnectTimeouts.set('+919999999999', setTimeout(() => {}, 10000));

    gracefulShutdown();
    expect(mockSock.end).toHaveBeenCalled();
    expect(sessions.size).toBe(0);
    expect(reconnectAttempts.size).toBe(0);
    expect(reconnectTimeouts.size).toBe(0);
  });
});
