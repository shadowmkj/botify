import { phoneNumberSchema } from '@repo/types';

let workerProcessor: Function = () => {};

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    addBulk: jest.fn().mockResolvedValue([]),
  })),
  Worker: jest.fn().mockImplementation((name, processor) => {
    workerProcessor = processor;
    return {};
  }),
}));

jest.mock('@repo/redis', () => ({
  redisOptions: jest.fn(() => ({})),
  redis: {
    publish: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock('@repo/db', () => ({
  prisma: {
    campaign: {
      findFirst: jest.fn(),
    },
    blast: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    device: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('baileys', () => ({
  generateWAMessageContent: jest.fn().mockResolvedValue({ imageMessage: {} }),
}));

jest.mock('baileys_helper', () => ({
  sendButtons: jest.fn(),
  sendInteractiveMessage: jest.fn().mockResolvedValue({ key: { id: 'msg_1' } }),
}));

jest.mock('../src/lib/whatsapp', () => ({
  startWhatsAppSession: jest.fn().mockResolvedValue({}),
}));

describe('wserver worker job processor', () => {
  let workerModule: any;

  beforeAll(() => {
    workerModule = require('../src/worker');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process connect-whatsapp job', async () => {
    const { startWhatsAppSession } = require('../src/lib/whatsapp');
    const job = {
      name: 'connect-whatsapp',
      data: {
        type: 'connect-whatsapp',
        sender: '+919999999999',
      },
    };

    await workerProcessor(job);
    expect(startWhatsAppSession).toHaveBeenCalledWith('+919999999999', true);
  });

  it('should ignore job when sender is invalid', async () => {
    const job = {
      name: 'send-button',
      data: {
        type: 'send-button',
        sender: 'not-a-number',
        receiver: '+918888888888',
        text: 'hello',
        buttons: [],
      },
    };

    await workerProcessor(job);
  });

  it('should process send-button with various media extensions (video, document, data url)', async () => {
    const mockSock = {
      onWhatsApp: jest.fn().mockResolvedValue([{ jid: '918888888888@s.whatsapp.net' }]),
      waUploadToServer: jest.fn(),
    };
    workerModule.sessions.set('+919999999999', mockSock);

    // Video media
    await workerProcessor({
      name: 'send-button',
      data: {
        type: 'send-button',
        sender: '+919999999999',
        receiver: '+918888888888',
        title: 'Video Title',
        text: 'Watch this video',
        footer: 'Footer',
        buttons: [{ name: 'quick_reply', buttonParamsJson: '{}' }],
        media: 'https://example.com/promo.mp4',
        mediaType: 'video',
      },
    });

    // Document media with custom mimeType and fileName
    await workerProcessor({
      name: 'send-button',
      data: {
        type: 'send-button',
        sender: '+919999999999',
        receiver: '+918888888888',
        text: 'Document download',
        buttons: [{ name: 'quick_reply', buttonParamsJson: '{}' }],
        media: 'https://example.com/invoice.pdf',
        mediaType: 'document',
        fileName: 'custom_invoice.pdf',
        mimeType: 'application/pdf',
      },
    });

    // Inferred media (without mediaType)
    await workerProcessor({
      name: 'send-button',
      data: {
        type: 'send-button',
        sender: '+919999999999',
        receiver: '+918888888888',
        text: 'Image download',
        buttons: [{ name: 'quick_reply', buttonParamsJson: '{}' }],
        media: 'https://example.com/photo.png',
      },
    });

    expect(mockSock.onWhatsApp).toHaveBeenCalled();
  });

  it('should process send-message with video, image, document, and data URLs', async () => {
    const mockSock = {
      onWhatsApp: jest.fn().mockResolvedValue([{ jid: '918888888888@s.whatsapp.net' }]),
      sendMessage: jest.fn().mockResolvedValue({ key: { id: 'sent_msg_1' } }),
    };
    workerModule.sessions.set('+919999999999', mockSock);

    // Image message
    await workerProcessor({
      name: 'send-message',
      data: {
        type: 'send-message',
        sender: '+919999999999',
        receiver: '+918888888888',
        message: 'Image Caption',
        media: 'https://example.com/image.jpg',
        mediaType: 'image',
        noDelay: true,
      },
    });

    // Video message
    await workerProcessor({
      name: 'send-message',
      data: {
        type: 'send-message',
        sender: '+919999999999',
        receiver: '+918888888888',
        message: 'Video Caption',
        media: 'https://example.com/clip.mp4',
        mediaType: 'video',
        noDelay: true,
      },
    });

    // Document message with inferred type
    await workerProcessor({
      name: 'send-message',
      data: {
        type: 'send-message',
        sender: '+919999999999',
        receiver: '+918888888888',
        message: 'Document Caption',
        media: 'https://example.com/sheet.xlsx',
        noDelay: true,
      },
    });

    // Data URL media message
    await workerProcessor({
      name: 'send-message',
      data: {
        type: 'send-message',
        sender: '+919999999999',
        receiver: '+918888888888',
        message: 'Data URL image',
        media: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        noDelay: true,
      },
    });

    expect(mockSock.sendMessage).toHaveBeenCalled();
  });

  it('should process campaign job with media and blasts', async () => {
    const { prisma } = require('@repo/db');
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue({
      id: 'camp_1',
      senderNumber: '+919999999999',
      message: 'Campaign Broadcast',
      media: 'https://example.com/banner.png',
      blasts: [
        {
          id: 'b1',
          contact: { phone: '+918888888888' },
        },
      ],
    });

    const mockSock = {
      onWhatsApp: jest.fn().mockResolvedValue([{ jid: '918888888888@s.whatsapp.net' }]),
      sendMessage: jest.fn().mockResolvedValue({ key: { id: 'blast_1' } }),
    };
    workerModule.sessions.set('+919999999999', mockSock);

    await workerProcessor({
      name: 'campaign',
      data: {
        type: 'campaign',
        sender: '+919999999999',
        campaignId: 'camp_1',
      },
    });

    expect(prisma.campaign.findFirst).toHaveBeenCalled();
  });

  it('should handle campaign job when campaign is not found or has no blasts', async () => {
    const { prisma } = require('@repo/db');
    (prisma.campaign.findFirst as jest.Mock).mockResolvedValue(null);

    await workerProcessor({
      name: 'campaign',
      data: {
        type: 'campaign',
        sender: '+919999999999',
        campaignId: 'camp_missing',
      },
    });
  });

  it('should process logout job and cleanup session', async () => {
    const mockSock = {
      logout: jest.fn().mockResolvedValue(true),
      end: jest.fn(),
    };
    workerModule.sessions.set('+919999999999', mockSock);

    await workerProcessor({
      name: 'logout',
      data: {
        type: 'logout',
        sender: '+919999999999',
      },
    });

    expect(mockSock.logout).toHaveBeenCalled();
    expect(workerModule.sessions.has('+919999999999')).toBe(false);
  });
});
