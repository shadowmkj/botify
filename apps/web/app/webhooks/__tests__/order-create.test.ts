import { POST } from "../order-create/route";
import { prisma } from "@repo/db";
import { MessageService } from "@/lib/messageService";
import crypto from "crypto";

jest.mock("@repo/db", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("@/lib/messageService", () => {
  return {
    MessageService: jest.fn().mockImplementation(() => ({
      queueSendMessage: jest.fn().mockResolvedValue({ id: "job_msg" }),
      queueButtonMessage: jest.fn().mockResolvedValue({ id: "job_btn" }),
    })),
  };
});

describe("Webhook: order-create", () => {
  const secret = "shopify_test_secret";
  const shopifyDomain = "store.myshopify.com";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createWebhookRequest = (payload: Record<string, unknown>, hmacSecret?: string, invalidKey = false) => {
    const rawBody = JSON.stringify(payload);
    const hmac = invalidKey
      ? "invalid_hmac_hash"
      : crypto
          .createHmac("sha256", hmacSecret || secret)
          .update(Buffer.from(rawBody))
          .digest("base64");

    return new Request("http://localhost:3000/webhooks/order-create", {
      method: "POST",
      headers: {
        "x-shopify-shop-domain": shopifyDomain,
        "x-shopify-hmac-sha256": hmac,
      },
      body: rawBody,
    });
  };

  it("should return 404 if user with shopifyDomain is not found", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createWebhookRequest({ id: 123 });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("should return 400 if user has no connected device", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "user_1",
      shopifyDomain,
      shopifyKey: secret,
      Device: [],
    });

    const req = createWebhookRequest({ id: 123 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 401 if HMAC signature is invalid", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "user_1",
      shopifyDomain,
      shopifyKey: secret,
      Device: [{ id: "dev_1", body: "+919999999999" }],
    });

    const req = createWebhookRequest({ id: 123 }, secret, true);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should use dynamic customer phone and queue button message when order_status_url is present", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "user_1",
      shopifyDomain,
      shopifyKey: secret,
      Device: [{ id: "dev_1", body: "+919999999999" }],
      shopifyTemplate: null,
      staticLogoUrl: "https://example.com/logo.png",
    });

    const payload = {
      id: 1001,
      order_status_url: "https://store.myshopify.com/orders/1001",
      customer: { phone: "+919876543210" },
      shipping_address: { phone: "+919876543210" },
    };

    const req = createWebhookRequest(payload);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const mockMessageService = (MessageService as jest.Mock).mock.results[0].value;
    expect(mockMessageService.queueButtonMessage).toHaveBeenCalledWith(
      "+919876543210",
      expect.stringContaining("Hi Thank you for Shopping"),
      expect.stringContaining("Hi Thank you for Shopping"),
      "Order Confirmation",
      "Keep tracking your order",
      expect.any(Array),
      "https://example.com/logo.png",
      { mediaType: "image" }
    );
  });

  it("should use default fallback phone when customer phone is absent", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "user_1",
      shopifyDomain,
      shopifyKey: secret,
      Device: [{ id: "dev_1", body: "+919999999999" }],
      shopifyTemplate: null,
    });

    const payload = {
      id: 1002,
      // No customer or shipping phone
    };

    const req = createWebhookRequest(payload);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const mockMessageService = (MessageService as jest.Mock).mock.results[0].value;
    expect(mockMessageService.queueSendMessage).toHaveBeenCalledWith(
      "+917902708908",
      expect.stringContaining("Hi Thank you for Shopping")
    );
  });
});
