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
const subscriberEventHandlers: Record<string, Function> = {};

jest.mock('socket.io', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
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

  beforeAll(() => {
    require('../server');
  });

  beforeEach(() => {
    mockSocket = {
      id: 'socket_123',
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

  it('should forward redis subscriber messages to socket rooms', () => {
    expect(subscriberEventHandlers['message']).toBeDefined();
    subscriberEventHandlers['message']('qr:919999999999', JSON.stringify({ event: 'QR' }));
    expect(mockTo).toHaveBeenCalledWith('919999999999');
    expect(mockToEmit).toHaveBeenCalledWith('qr-update', JSON.stringify({ event: 'QR' }));
  });

  it('should handle client connection and subscribe-to-qr when device not found', async () => {
    ioEventHandlers['connection'](mockSocket);
    (prisma.device.findFirst as jest.Mock).mockResolvedValue(null);

    await socketEventHandlers['subscribe-to-qr']({ sessionId: 'invalid_session' });
    expect(mockSocketEmit).toHaveBeenCalledWith(
      'qr-update',
      JSON.stringify({ event: 'LOGOUT', error: 'Device not found' })
    );
  });

  it('should handle subscribe-to-qr successfully and create job if not exists', async () => {
    ioEventHandlers['connection'](mockSocket);
    (prisma.device.findFirst as jest.Mock).mockResolvedValue({
      id: 'sess_1',
      body: '919999999999',
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
    });
    mockQueueGetJob.mockResolvedValue(null);

    await socketEventHandlers['subscribe-to-qr']({ sessionId: 'sess_dc' });
    await socketEventHandlers['disconnect']();

    expect(subscriber.unsubscribe).toHaveBeenCalledWith('qr:918888888888');
  });
});
