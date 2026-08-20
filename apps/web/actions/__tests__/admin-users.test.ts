import { updateUser, assignPlan, impersonateUser } from "@/actions/admin-users";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

jest.mock("@repo/db", () => ({
  prisma: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
      adminImpersonateUser: jest.fn(),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("admin-users actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("auth and role guards", () => {
    it("should throw error if session is missing", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(
        updateUser({ id: "u1", role: "user" })
      ).rejects.toThrow("Not authenticated");
    });

    it("should throw error if user is not admin", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "u1", role: "user" },
      });
      await expect(
        updateUser({ id: "u2", role: "user" })
      ).rejects.toThrow("Not authorized");
    });
  });

  describe("updateUser", () => {
    beforeEach(() => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "admin_1", role: "admin" },
      });
    });

    it("should update user information and ban status", async () => {
      const res = await updateUser({
        id: "u2",
        name: "John Doe",
        role: "user",
        banned: true,
        banReason: "Violated terms",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u2" },
        data: {
          name: "John Doe",
          role: "user",
          banned: true,
          banReason: "Violated terms",
        },
      });
      expect(res).toEqual({ ok: true });
    });
  });

  describe("assignPlan", () => {
    beforeEach(() => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "admin_1", role: "admin" },
      });
    });

    it("should throw error if plan does not exist", async () => {
      (prisma.plan.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        assignPlan({ userId: "u2", planId: "nonexistent_plan" })
      ).rejects.toThrow("Plan not found");
    });

    it("should assign existing plan to user", async () => {
      (prisma.plan.findUnique as jest.Mock).mockResolvedValue({ id: "plan_pro" });

      const res = await assignPlan({ userId: "u2", planId: "plan_pro" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u2" },
        data: { planId: "plan_pro" },
      });
      expect(res).toEqual({ ok: true });
    });
  });

  describe("impersonateUser", () => {
    beforeEach(() => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "admin_1", role: "admin" },
      });
    });

    it("should throw error if target user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(impersonateUser({ userId: "u_none" })).rejects.toThrow("User not found");
    });

    it("should throw error if target user is also admin", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u_admin2",
        role: "admin",
      });
      await expect(impersonateUser({ userId: "u_admin2" })).rejects.toThrow("Cannot impersonate another admin");
    });

    it("should throw error if target user is banned", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u_banned",
        role: "user",
        banned: true,
      });
      await expect(impersonateUser({ userId: "u_banned" })).rejects.toThrow("Cannot impersonate a banned user");
    });

    it("should impersonate user and redirect to dashboard", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u_regular",
        role: "user",
        banned: false,
      });

      await impersonateUser({ userId: "u_regular" });
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });
  });
});
