import initAutoreply from '../src/autoreply';
import { prisma } from '@repo/db';
import { Queue } from 'bullmq';

const mockQueueAdd = jest.fn();
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
  })),
}));

jest.mock('@repo/redis', () => ({
  redis: {},
}));

jest.mock('@repo/db', () => ({
  prisma: {
    device: {
      findMany: jest.fn(),
    },
  },
}));

describe('wserver initAutoreply', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger autoreply when incoming message matches keyword', async () => {
    (prisma.device.findMany as jest.Mock).mockResolvedValue([
      {
        autoreplies: [
          { keyword: 'pricing', reply: 'Our pricing starts at $10/mo' },
        ],
      },
    ]);

    const upsert: any = {
      messages: [
        {
          key: { fromMe: false, remoteJid: '919876543210@s.whatsapp.net' },
          message: {
            conversation: 'Pricing',
          },
        },
      ],
    };

    await initAutoreply(upsert, '919999999999');

    expect(mockQueueAdd).toHaveBeenCalledWith('send-message', {
      type: 'send-message',
      sender: '919999999999',
      receiver: '919876543210@s.whatsapp.net',
      message: 'Our pricing starts at $10/mo',
      noDelay: true,
    });
  });

  it('should ignore message from self (fromMe: true)', async () => {
    (prisma.device.findMany as jest.Mock).mockResolvedValue([
      {
        autoreplies: [
          { keyword: 'pricing', reply: 'Our pricing starts at $10/mo' },
        ],
      },
    ]);

    const upsert: any = {
      messages: [
        {
          key: { fromMe: true, remoteJid: '919876543210@s.whatsapp.net' },
          message: {
            conversation: 'pricing',
          },
        },
      ],
    };

    await initAutoreply(upsert, '919999999999');
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });
});
