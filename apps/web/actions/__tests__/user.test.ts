import { updateUserLogo } from "@/actions/user";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

jest.mock("@repo/db", () => ({
  prisma: {
    user: {
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

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("user actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if session is missing", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue(null);
    await expect(
      updateUserLogo({ staticLogoUrl: "https://example.com/logo.png" })
    ).rejects.toThrow("Not authenticated");
  });

  it("should update user logo successfully", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "u1" },
    });

    const res = await updateUserLogo({
      staticLogoUrl: "https://example.com/logo.png",
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { staticLogoUrl: "https://example.com/logo.png" },
    });
    expect(res).toEqual({ ok: true });
  });

  it("should support clearing logo with empty string or null", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "u1" },
    });

    const res = await updateUserLogo({
      staticLogoUrl: "",
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { staticLogoUrl: null },
    });
    expect(res).toEqual({ ok: true });
  });
});
