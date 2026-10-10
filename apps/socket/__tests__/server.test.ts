import { createServer } from 'http';
import { Server } from 'socket.io';
import { subscriber } from '@repo/redis';
import { prisma } from '@repo/db';
import { Queue } from 'bullmq';

const mockListen = jest.fn();
jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: mockListen,
  })),
}));

const mockSocketEmit = jest.fn();
const mockSocketJoin = jest.fn();
const mockToEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockToEmit }));

const socketEventHandlers: Record<string, Function> = {};
const ioEventHandlers: Record<string, Function> = {};
let ioMiddleware: Function = () => {};
const subscriberEventHandlers: Record<string, Function> = {};

jest.mock('socket.io', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      use: jest.fn((middleware: Function) => {
        ioMiddleware = middleware;
      }),
      on: jest.fn((event: string, cb: Function) => {
        ioEventHandlers[event] = cb;
      }),
      to: mockTo,
    })),
  };
});

jest.mock('@repo/redis', () => ({
  subscriber: {
    on: jest.fn((event: string, cb: Function) => {
      subscriberEventHandlers[event] = cb;
    }),
    subscribe: jest.fn().mockResolvedValue(1),
    unsubscribe: jest.fn().mockResolvedValue(1),
  },
  redis: {},
}));

jest.mock('@repo/db', () => ({
  prisma: {
    device: {
      findFirst: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
    },
  },
}));

const mockQueueGetJob = jest.fn();
const mockQueueAdd = jest.fn();
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    getJob: mockQueueGetJob,
    add: mockQueueAdd,
  })),
}));

describe('Socket Server', () => {
  let mockSocket: any;
  let serverModule: any;

  beforeAll(() => {
    serverModule = require('../server');
  });

  beforeEach(() => {
    mockSocketEmit.mockClear();
    mockSocketJoin.mockClear();
    mockToEmit.mockClear();
    mockTo.mockClear();
    mockQueueGetJob.mockClear();
    mockQueueAdd.mockClear();
    (prisma.device.findFirst as jest.Mock).mockReset();
    (prisma.session.findUnique as jest.Mock).mockReset();
    mockSocket = {
      id: 'socket_123',
      userId: 'user_123',
      handshake: {
        auth: {},
        headers: {},
      },
      join: mockSocketJoin,
      emit: mockSocketEmit,
      on: jest.fn((event: string, cb: Function) => {
        socketEventHandlers[event] = cb;
      }),
    };
  });

  it('should create an http server and a socket.io server', () => {
    expect(createServer).toHaveBeenCalled();
    expect(Server).toHaveBeenCalled();
  });

  describe('extractSessionToken and Auth Middleware', () => {
    it('should extract token from auth object', () => {
      const socket = {
        handshake: { auth: { token: 'auth_token_123' }, headers: {} },
      } as any;
      expect(serverModule.extractSessionToken(socket)).toBe('auth_token_123');
    });

    it('should extract token from Authorization header', () => {
      const socket = {
        handshake: { auth: {}, headers: { authorization: 'Bearer header_token_123' } },
      } as any;
      expect(serverModule.extractSessionToken(socket)).toBe('header_token_123');
    });

    it('should extract token from cookie header', () => {
      const socket = {
        handshake: {
          auth: {},
          headers: { cookie: 'other=123; better-auth.session_token=cookie_token_123; foo=bar' },
        },
      } as any;
      expect(serverModule.extractSessionToken(socket)).toBe('cookie_token_123');
    });

    it('should return null when no token is present', () => {
      const socket = {
        handshake: { auth: {}, headers: {} },
      } as any;
      expect(serverModule.extractSessionToken(socket)).toBeNull();
    });

    it('should reject connection when token is missing', async () => {
      const next = jest.fn();
      const socket = {
        handshake: { auth: {}, headers: {} },
      } as any;

      await ioMiddleware(socket, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Missing session token/);
    });

    it('should reject connection when session is expired or not found', async () => {
      const next = jest.fn();
      const socket = {
        handshake: { auth: { token: 'invalid_token' }, headers: {} },
      } as any;

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      await ioMiddleware(socket, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Invalid or expired session/);
    });

    it('should authenticate socket and attach userId when session is valid', async () => {
      const next = jest.fn();
      const socket = {
        handshake: { auth: { token: 'valid_token.signature' }, headers: {} },
      } as any;

      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'sess_db_1',
        token: 'valid_token',
        userId: 'user_456',
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'user_456', email: 'test@example.com' },
      });

      await ioMiddleware(socket, next);
      expect(next).toHaveBeenCalledWith();
      expect(socket.userId).toBe('user_456');
      expect(socket.user).toBeDefined();
    });
  });

  it('should forward redis subscriber messages to socket rooms', () => {
    expect(subscriberEventHandlers['message']).toBeDefined();
    subscriberEventHandlers['message']('qr:919999999999', JSON.stringify({ event: 'QR' }));
    expect(mockTo).toHaveBeenCalledWith('919999999999');
    expect(mockToEmit).toHaveBeenCalledWith('qr-update', JSON.stringify({ event: 'QR' }));
  });

  it('should reject subscribe-to-qr when socket has no userId', async () => {
    ioEventHandlers['connection'](mockSocket);
    mockSocket.userId = undefined;

    await socketEventHandlers['subscribe-to-qr']({ sessionId: 'device_123' });
    expect(mockSocketEmit).toHaveBeenCalledWith(
      'qr-update',
      JSON.stringify({ event: 'LOGOUT', error: 'Unauthorized' })
    );
  });

  it('should handle client connection and subscribe-to-qr when device not found or unauthorized', async () => {
    ioEventHandlers['connection'](mockSocket);
    (prisma.device.findFirst as jest.Mock).mockResolvedValue(null);

    await socketEventHandlers['subscribe-to-qr']({ sessionId: 'invalid_session' });
    expect(prisma.device.findFirst).toHaveBeenCalledWith({
      where: { id: 'invalid_session', userId: 'user_123' },
    });
    expect(mockSocketEmit).toHaveBeenCalledWith(
      'qr-update',
      JSON.stringify({ event: 'LOGOUT', error: 'Device not found or unauthorized' })
    );
  });

  it('should handle subscribe-to-qr successfully and create job if not exists', async () => {
    ioEventHandlers['connection'](mockSocket);
    (prisma.device.findFirst as jest.Mock).mockResolvedValue({
      id: 'sess_1',
      body: '919999999999',
      userId: 'user_123',
    });
    mockQueueGetJob.mockResolvedValue(null);

    await socketEventHandlers['subscribe-to-qr']({ sessionId: 'sess_1' });

    expect(mockSocketJoin).toHaveBeenCalledWith('919999999999');
    expect(subscriber.subscribe).toHaveBeenCalledWith('qr:919999999999');
    expect(mockQueueAdd).toHaveBeenCalledWith(
      'connect-whatsapp',
      { type: 'connect-whatsapp', sender: '919999999999' },
      expect.objectContaining({ jobId: '919999999999' })
    );
  });

  it('should handle subscribe-to-qr when job already exists and is active', async () => {
    ioEventHandlers['connection'](mockSocket);
    (prisma.device.findFirst as jest.Mock).mockResolvedValue({
      id: 'sess_1',
      body: '919999999999',
      userId: 'user_123',
    });
    mockQueueGetJob.mockResolvedValue({
      isCompleted: jest.fn().mockResolvedValue(false),
      isFailed: jest.fn().mockResolvedValue(false),
    });

    await socketEventHandlers['subscribe-to-qr']({ sessionId: 'sess_1' });
    expect(mockSocketJoin).toHaveBeenCalledWith('919999999999');
  });

  it('should handle subscribe-to-qr error', async () => {
    ioEventHandlers['connection'](mockSocket);
    (prisma.device.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

    await socketEventHandlers['subscribe-to-qr']({ sessionId: 'sess_err' });
    expect(mockSocketEmit).toHaveBeenCalledWith(
      'qr-update',
      JSON.stringify({ event: 'LOGOUT', error: 'Subscription failed' })
    );
  });

  it('should handle disconnect cleanup', async () => {
    ioEventHandlers['connection'](mockSocket);
    (prisma.device.findFirst as jest.Mock).mockResolvedValue({
      id: 'sess_dc',
      body: '918888888888',
      userId: 'user_123',
    });
    mockQueueGetJob.mockResolvedValue(null);

    await socketEventHandlers['subscribe-to-qr']({ sessionId: 'sess_dc' });
    await socketEventHandlers['disconnect']();

    expect(subscriber.unsubscribe).toHaveBeenCalledWith('qr:918888888888');
  });
});
