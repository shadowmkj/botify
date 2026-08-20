import { createPlan, updatePlan, deletePlan, getPlans } from "@/actions/plan";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

jest.mock("@repo/db", () => ({
  prisma: {
    plan: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
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

describe("plan actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("unauthorized checks", () => {
    it("should throw error if session is missing for createPlan", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(
        createPlan({ name: "Basic", price: 10, devicesLimit: 1 })
      ).rejects.toThrow("Not authorized");
    });

    it("should throw error if session is missing for updatePlan", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(
        updatePlan("p1", { name: "Basic", price: 10, devicesLimit: 1 })
      ).rejects.toThrow("Not authorized");
    });

    it("should throw error if session is missing for deletePlan", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(deletePlan("p1")).rejects.toThrow("Not authorized");
    });

    it("should throw error if session is missing for getPlans", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(getPlans()).rejects.toThrow("Not authorized");
    });
  });

  describe("authorized actions", () => {
    beforeEach(() => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "admin_1" },
      });
    });

    it("should create a plan", async () => {
      await createPlan({
        name: "Pro Plan",
        description: "Professional",
        price: 99,
        messageLimit: 5000,
        devicesLimit: 5,
      });

      expect(prisma.plan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Pro Plan",
          description: "Professional",
          price: 99,
          messageLimit: 5000,
          devicesLimit: 5,
        }),
      });
    });

    it("should update a plan", async () => {
      await updatePlan("plan_123", {
        name: "Pro Plan Updated",
        price: 120,
        devicesLimit: 10,
      });

      expect(prisma.plan.update).toHaveBeenCalledWith({
        where: { id: "plan_123" },
        data: expect.objectContaining({
          name: "Pro Plan Updated",
          price: 120,
          devicesLimit: 10,
        }),
      });
    });

    it("should delete a plan", async () => {
      await deletePlan("plan_123");
      expect(prisma.plan.delete).toHaveBeenCalledWith({
        where: { id: "plan_123" },
      });
    });

    it("should get all plans ordered by createdAt desc", async () => {
      (prisma.plan.findMany as jest.Mock).mockResolvedValue([
        { id: "1", name: "Pro" },
      ]);

      const plans = await getPlans();
      expect(prisma.plan.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
      expect(plans).toHaveLength(1);
    });
  });
});
