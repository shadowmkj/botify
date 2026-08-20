import { promoteFirstUser } from "@/actions/onboarding";
import { prisma } from "@repo/db";

jest.mock("@repo/db", () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("onboarding actions promoteFirstUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if user count is not exactly 1", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(2);

    await expect(
      promoteFirstUser({ email: "admin@example.com" })
    ).rejects.toThrow("Onboarding is not available or already completed");
  });

  it("should throw error if user is not found", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      promoteFirstUser({ email: "notfound@example.com" })
    ).rejects.toThrow("User not found after sign up");
  });

  it("should return ok: true if user is already admin", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "u1",
      role: "admin",
    });

    const res = await promoteFirstUser({ email: "admin@example.com" });
    expect(res).toEqual({ ok: true });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should promote first user to admin", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "u1",
      role: "user",
    });

    const res = await promoteFirstUser({ email: "user1@example.com" });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { role: "admin" },
    });
    expect(res).toEqual({ ok: true });
  });
});
