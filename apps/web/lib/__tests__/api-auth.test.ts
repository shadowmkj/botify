/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyApiAccess } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      verifyApiKey: jest.fn(),
    },
  },
}));

describe("verifyApiAccess", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw 401 Response if x-api-key header is missing", async () => {
    const req = new Request("http://localhost/api/test", {
      headers: {},
    });

    await expect(verifyApiAccess(req)).rejects.toBeInstanceOf(Response);
    try {
      await verifyApiAccess(req);
    } catch (e: any) {
      expect(e.status).toBe(401);
      const json = await e.json();
      expect(json.error).toBe("Missing API key");
    }
  });

  it("should return ApiKeyContext when key is valid", async () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-api-key": "valid_key_123" },
    });

    (auth.api.verifyApiKey as jest.Mock).mockResolvedValue({
      valid: true,
      key: { id: "k1", userId: "user_abc" },
    });

    const ctx = await verifyApiAccess(req);
    expect(ctx.userId).toBe("user_abc");
    expect(ctx.key).toEqual({ id: "k1", userId: "user_abc" });
  });

  it("should throw 429 when rate limit is exceeded", async () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-api-key": "rate_limited_key" },
    });

    (auth.api.verifyApiKey as jest.Mock).mockResolvedValue({
      valid: false,
      error: { code: "RATE_LIMIT_EXCEEDED" },
    });

    try {
      await verifyApiAccess(req);
    } catch (e: any) {
      expect(e.status).toBe(429);
      const json = await e.json();
      expect(json.error).toBe("API key rate limit reached");
    }
  });

  it("should throw 401 when key is invalid", async () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-api-key": "bad_key" },
    });

    (auth.api.verifyApiKey as jest.Mock).mockResolvedValue({
      valid: false,
      key: null,
    });

    try {
      await verifyApiAccess(req);
    } catch (e: any) {
      expect(e.status).toBe(401);
      const json = await e.json();
      expect(json.error).toBe("Invalid or unauthorized API key");
    }
  });

  it("should handle unexpected exception during verification", async () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-api-key": "err_key" },
    });

    (auth.api.verifyApiKey as jest.Mock).mockRejectedValue(new Error("DB error"));

    try {
      await verifyApiAccess(req);
    } catch (e: any) {
      expect(e.status).toBe(401);
      const json = await e.json();
      expect(json.error).toBe("Invalid or unauthorized API key");
    }
  });
});
