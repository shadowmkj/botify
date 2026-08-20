import { MessageService } from "@/lib/messageService";
import { prisma } from "@repo/db";

jest.mock("@repo/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    device: {
      findMany: jest.fn(),
    },
    campaign: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("bullmq", () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: "job_1" }),
      addBulk: jest.fn().mockResolvedValue([{ id: "job_1" }, { id: "job_2" }]),
    })),
  };
});

describe("MessageService", () => {
  const sender = "+919999999999";
  const userId = "user_123";
  let service: MessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessageService(sender, userId);
  });

  describe("plan limits and assertions", () => {
    it("should return remaining messages when limit exists", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        plan: { messageLimit: 100 },
      });
      (prisma.device.findMany as jest.Mock).mockResolvedValue([
        { messagesSent: 20 },
        { messagesSent: 10 },
      ]);

      const remaining = await service.getRemainingMessages();
      expect(remaining).toBe(70);
    });

    it("should return Infinity if messageLimit is null (unlimited)", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        plan: { messageLimit: null },
      });

      const remaining = await service.getRemainingMessages();
      expect(remaining).toBe(Number.POSITIVE_INFINITY);
    });

    it("should throw QUOTA_EXCEEDED when quota is insufficient", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        plan: { messageLimit: 50 },
      });
      (prisma.device.findMany as jest.Mock).mockResolvedValue([
        { messagesSent: 45 },
      ]);

      await expect(service.assertCanQueue(10)).rejects.toMatchObject({
        code: "QUOTA_EXCEEDED",
        left: 5,
        limit: 50,
      });
    });

    it("should pass assertCanQueue when quota is sufficient", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        plan: { messageLimit: 50 },
      });
      (prisma.device.findMany as jest.Mock).mockResolvedValue([
        { messagesSent: 10 },
      ]);

      const res = await service.assertCanQueue(5);
      expect(res.ok).toBe(true);
      expect(res.left).toBe(40);
    });
  });

  describe("queue methods", () => {
    it("should queue single message", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        plan: { messageLimit: null },
      });

      const res = await service.queueSendMessage("+918888888888", "Hello there");
      expect(res).toBeDefined();
    });

    it("should queue button message", async () => {
      const res = await service.queueButtonMessage(
        "+918888888888",
        "Hello",
        "Body text",
        "Title",
        "Footer",
        []
      );
      expect(res).toBeDefined();
    });

    it("should queue bulk messages", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        plan: { messageLimit: 100 },
      });
      (prisma.device.findMany as jest.Mock).mockResolvedValue([{ messagesSent: 0 }]);

      const items = [
        { receiver: "+918888888888", message: "Msg 1" },
        { receiver: "+917777777777", message: "Msg 2" },
      ];
      const res = await service.queueBulkSendMessages(items);
      expect(res).toHaveLength(2);
    });

    it("should queue campaign", async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: "camp_1",
        blasts: [{ id: "b1" }, { id: "b2" }],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        plan: { messageLimit: null },
      });

      const res = await service.queueCampaign("camp_1");
      expect(res).toBeDefined();
    });

    it("should return null if campaign has 0 blasts", async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: "camp_empty",
        blasts: [],
      });

      const res = await service.queueCampaign("camp_empty");
      expect(res).toBeNull();
    });

    it("should queue button campaign with valid JSON", async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: "camp_btn",
        media: "https://example.com/image.png",
        blasts: [
          { id: "b1", contact: { phone: "+919999999999" } },
        ],
      });

      const buttonPayload = JSON.stringify({
        header: "Special Offer",
        body: "Get 20% off",
        footer: "Botify",
        buttons: [
          { id: "b1", type: "quick_reply", text: "Claim Now", payload: "CLAIM" },
        ],
      });

      const res = await service.queueButtonCampaign("camp_btn", buttonPayload);
      expect(res).toBeDefined();
    });

    it("should throw error if button campaign JSON is invalid", async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: "camp_btn",
        blasts: [
          { id: "b1", contact: { phone: "+919999999999" } },
        ],
      });

      await expect(
        service.queueButtonCampaign("camp_btn", "invalid-json")
      ).rejects.toThrow("Invalid buttonPayloadJson");
    });

    it("should return null if button campaign has no blasts", async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: "camp_btn",
        blasts: [],
      });

      const res = await service.queueButtonCampaign("camp_btn", "{}");
      expect(res).toBeNull();
    });
  });
});
