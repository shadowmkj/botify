import { updateDeviceStatus } from '../src/lib/helper';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    device: {
      update: jest.fn(),
    },
  },
  DeviceStatus: {
    Connected: 'Connected',
    Disconnected: 'Disconnected',
    Pending: 'Pending',
  },
}));

describe('wserver helper updateDeviceStatus', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update device status in database', async () => {
    (prisma.device.update as jest.Mock).mockResolvedValue({
      id: 'd1',
      body: '+919999999999',
      status: 'Connected',
    });

    const res = await updateDeviceStatus('+919999999999', 'Connected' as any);
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { body: '+919999999999' },
      data: { status: 'Connected' },
    });
    expect(res.status).toBe('Connected');
  });

  it('should throw error if update returns null', async () => {
    (prisma.device.update as jest.Mock).mockResolvedValue(null);

    await expect(
      updateDeviceStatus('+919999999999', 'Disconnected' as any)
    ).rejects.toThrow(/Failed to update device status/);
  });
});
