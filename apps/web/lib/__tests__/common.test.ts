import { getMessagesSent, verifyHMAC, capitalizeFirstLetter } from "@/lib/common";
import { prisma } from "@repo/db";
import crypto from "crypto";

jest.mock("@repo/db", () => ({
  prisma: {
    device: {
      findMany: jest.fn(),
    },
  },
}));

describe("common lib utilities", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getMessagesSent", () => {
    it("should calculate total messages sent across all user devices", async () => {
      (prisma.device.findMany as jest.Mock).mockResolvedValue([
        { messagesSent: 15 },
        { messagesSent: 25 },
        { messagesSent: 0 },
      ]);

      const total = await getMessagesSent("user_123");
      expect(prisma.device.findMany).toHaveBeenCalledWith({
        where: { userId: "user_123" },
      });
      expect(total).toBe(40);
    });

    it("should return 0 if no devices found", async () => {
      (prisma.device.findMany as jest.Mock).mockResolvedValue([]);
      const total = await getMessagesSent("user_empty");
      expect(total).toBe(0);
    });
  });

  describe("verifyHMAC", () => {
    it("should return true for valid HMAC signature", () => {
      const secret = "supersecret";
      const rawBody = Buffer.from(JSON.stringify({ event: "test" }));
      const validHmac = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("base64");

      const result = verifyHMAC(rawBody, validHmac, secret);
      expect(result).toBe(true);
    });

    it("should return false for invalid HMAC signature", () => {
      const secret = "supersecret";
      const rawBody = Buffer.from(JSON.stringify({ event: "test" }));
      const invalidHmac = crypto
        .createHmac("sha256", "wrongsecret")
        .update(rawBody)
        .digest("base64");

      const result = verifyHMAC(rawBody, invalidHmac, secret);
      expect(result).toBe(false);
    });
  });

  describe("capitalizeFirstLetter", () => {
    it("should capitalize the first character of a string", () => {
      expect(capitalizeFirstLetter("hello")).toBe("Hello");
      expect(capitalizeFirstLetter("world")).toBe("World");
      expect(capitalizeFirstLetter("a")).toBe("A");
    });
  });
});
