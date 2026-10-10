import { POST } from "../product-update/route";
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
    })),
  };
});

describe("Webhook: product-update", () => {
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

    return new Request("http://localhost:3000/webhooks/product-update", {
      method: "POST",
      headers: {
        "x-shopify-shop-domain": shopifyDomain,
        "x-shopify-hmac-sha256": hmac,
      },
      body: rawBody,
    });
  };

  it("should return 404 if user is not found", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createWebhookRequest({ title: "Product A" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("should return 400 if user has no device", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "user_1",
      shopifyDomain,
      shopifyKey: secret,
      Device: [],
    });

    const req = createWebhookRequest({ title: "Product A" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 401 if HMAC is invalid", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "user_1",
      shopifyDomain,
      shopifyKey: secret,
      Device: [{ id: "dev_1", body: "+919999999999" }],
    });

    const req = createWebhookRequest({ title: "Product A" }, secret, true);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should send notification to default phone number when product updates", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "user_1",
      shopifyDomain,
      shopifyKey: secret,
      Device: [{ id: "dev_1", body: "+919999999999" }],
    });

    const req = createWebhookRequest({ title: "Cool Shoes" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const mockMessageService = (MessageService as jest.Mock).mock.results[0].value;
    expect(mockMessageService.queueSendMessage).toHaveBeenCalledWith(
      "+917012749946",
      "Cool Shoes has been updated"
    );
  });
});
