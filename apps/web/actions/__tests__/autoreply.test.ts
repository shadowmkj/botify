import { addAutoreply, deleteAutoreply } from "@/actions/autoreply";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

jest.mock("@repo/db", () => ({
  prisma: {
    device: {
      findFirst: jest.fn(),
    },
    autoreply: {
      create: jest.fn(),
      delete: jest.fn(),
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

describe("autoreply actions", () => {
  beforeEach(() => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if device not found when adding autoreply", async () => {
    (prisma.device.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      addAutoreply({
        keyword: "help",
        reply: "How can I help you?",
        deviceNumber: "+919999999999",
      })
    ).rejects.toThrow("Device not found");
  });

  it("should create autoreply for valid device", async () => {
    (prisma.device.findFirst as jest.Mock).mockResolvedValue({
      id: "dev_1",
    });

    await addAutoreply({
      keyword: "help",
      reply: "How can I help you?",
      deviceNumber: "+919999999999",
    });

    expect(prisma.autoreply.create).toHaveBeenCalledWith({
      data: {
        keyword: "help",
        reply: "How can I help you?",
        deviceId: "dev_1",
      },
    });
  });

  it("should delete autoreply by id", async () => {
    await deleteAutoreply({ id: "ar_1" });
    expect(prisma.autoreply.delete).toHaveBeenCalledWith({
      where: { id: "ar_1" },
    });
  });
});
