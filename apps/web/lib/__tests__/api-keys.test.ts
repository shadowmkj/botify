import { ApiKeyService } from "@/lib/api-keys";
import { authClient } from "@/lib/auth-client";

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    apiKey: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe("ApiKeyService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should list api keys", async () => {
    (authClient.apiKey.list as jest.Mock).mockResolvedValue({ data: [], error: null });
    const res = await ApiKeyService.list();
    expect(authClient.apiKey.list).toHaveBeenCalled();
    expect(res.data).toEqual([]);
  });

  it("should create api key with expiresIn", async () => {
    (authClient.apiKey.create as jest.Mock).mockResolvedValue({
      data: { id: "k1", key: "sec_123" },
      error: null,
    });

    const res = await ApiKeyService.create({ name: "My Key", expiresIn: 3600 });
    expect(authClient.apiKey.create).toHaveBeenCalledWith({
      name: "My Key",
      expiresIn: 3600,
    });
    expect(res.data?.id).toBe("k1");
  });

  it("should handle expiresIn -1 as undefined on create", async () => {
    (authClient.apiKey.create as jest.Mock).mockResolvedValue({
      data: { id: "k2", key: "sec_456" },
      error: null,
    });

    await ApiKeyService.create({ name: "Never Expire", expiresIn: -1 });
    expect(authClient.apiKey.create).toHaveBeenCalledWith({
      name: "Never Expire",
      expiresIn: undefined,
    });
  });

  it("should update api key", async () => {
    (authClient.apiKey.update as jest.Mock).mockResolvedValue({
      data: { id: "k1", name: "Updated Key" },
      error: null,
    });

    const res = await ApiKeyService.update({ keyId: "k1", name: "Updated Key" });
    expect(authClient.apiKey.update).toHaveBeenCalledWith({
      keyId: "k1",
      name: "Updated Key",
    });
    expect(res.data?.name).toBe("Updated Key");
  });

  it("should delete api key", async () => {
    (authClient.apiKey.delete as jest.Mock).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const res = await ApiKeyService.delete("k1");
    expect(authClient.apiKey.delete).toHaveBeenCalledWith({ keyId: "k1" });
    expect(res.data?.success).toBe(true);
  });

  it("should get api key by id", async () => {
    (authClient.apiKey.get as jest.Mock).mockResolvedValue({
      data: { id: "k1" },
      error: null,
    });

    const res = await ApiKeyService.get("k1");
    expect(authClient.apiKey.get).toHaveBeenCalledWith({ query: { id: "k1" } });
    expect(res.data?.id).toBe("k1");
  });
});
