import { GET, POST } from "../route";
import { maskShopifyKey } from "@/lib/shopify";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

jest.mock("@repo/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

describe("shopify settings API route", () => {
  beforeEach(() => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("maskShopifyKey helper", () => {
    it("should return null for empty or null key", () => {
      expect(maskShopifyKey(null)).toBeNull();
      expect(maskShopifyKey(undefined)).toBeNull();
      expect(maskShopifyKey("")).toBeNull();
    });

    it("should mask short keys with 4 asterisks", () => {
      expect(maskShopifyKey("12345678")).toBe("****");
    });

    it("should mask long keys retaining prefix and suffix", () => {
      expect(maskShopifyKey("shpat_1234567890abcdef")).toBe("shpat_****cdef");
    });
  });

  describe("GET /api/settings/shopify", () => {
    it("should return 401 when unauthorized", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("should return masked shopify settings for user", async () => {
      const now = new Date();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        shopifyKey: "shpat_1234567890abcdef",
        shopifyDomain: "mystore.myshopify.com",
        shopifyTemplateId: "tpl_123",
        updatedAt: now,
      });

      const res = await GET();
      expect(res.status).toBe(200);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user_1" },
        select: {
          shopifyKey: true,
          shopifyDomain: true,
          shopifyTemplateId: true,
          updatedAt: true,
        },
      });
    });

    it("should return null values when user has no shopify settings configured", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(200);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user_1" },
        select: expect.any(Object),
      });
    });
  });

  describe("POST /api/settings/shopify", () => {
    it("should return 401 when unauthorized", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      const req = new Request("http://localhost/api/settings/shopify", {
        method: "POST",
        body: JSON.stringify({
          shopifyKey: "shpat_1234567890abcdef",
          shopifyDomain: "mystore.myshopify.com",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid domain format", async () => {
      const req = new Request("http://localhost/api/settings/shopify", {
        method: "POST",
        body: JSON.stringify({
          shopifyKey: "shpat_1234567890abcdef",
          shopifyDomain: "invalid-domain",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should update all settings when valid plaintext key provided", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const req = new Request("http://localhost/api/settings/shopify", {
        method: "POST",
        body: JSON.stringify({
          shopifyKey: "shpat_1234567890abcdef",
          shopifyDomain: "mystore.myshopify.com",
          shopifyTemplateId: "tpl_123",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_1" },
        data: {
          shopifyKey: "shpat_1234567890abcdef",
          shopifyDomain: "mystore.myshopify.com",
          shopifyTemplateId: "tpl_123",
        },
      });
    });

    it("should not overwrite existing shopifyKey if submitted with masked key", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const req = new Request("http://localhost/api/settings/shopify", {
        method: "POST",
        body: JSON.stringify({
          shopifyKey: "shpat_****cdef",
          shopifyDomain: "updatedstore.myshopify.com",
          shopifyTemplateId: null,
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_1" },
        data: {
          shopifyDomain: "updatedstore.myshopify.com",
          shopifyTemplateId: null,
        },
      });
    });
  });
});
