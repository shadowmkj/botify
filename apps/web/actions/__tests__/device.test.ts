import {
  getDevices,
  getConnectedDevices,
  addDevice,
  deleteDevice,
  logoutDevice,
} from "@/actions/device";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

jest.mock("@repo/db", () => ({
  prisma: {
    device: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
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

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("device actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getDevices", () => {
    it("should throw error when unauthenticated", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(getDevices()).rejects.toThrow("User not authenticated");
    });

    it("should return devices for authenticated user", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "user_1" },
      });
      (prisma.device.findMany as jest.Mock).mockResolvedValue([{ id: "dev_1" }]);

      const result = await getDevices();
      expect(prisma.device.findMany).toHaveBeenCalledWith({
        where: { userId: "user_1" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("getConnectedDevices", () => {
    it("should throw error when unauthenticated", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(getConnectedDevices()).rejects.toThrow("User not authenticated");
    });

    it("should return connected devices for user", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "user_1" },
      });
      (prisma.device.findMany as jest.Mock).mockResolvedValue([
        { id: "dev_conn", status: "Connected" },
      ]);

      const result = await getConnectedDevices();
      expect(prisma.device.findMany).toHaveBeenCalledWith({
        where: { userId: "user_1", status: "Connected" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("addDevice", () => {
    it("should successfully add a device", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "user_1" },
      });
      (prisma.device.create as jest.Mock).mockResolvedValue({
        id: "d1",
        body: "+919999999999",
      });

      const res = await addDevice({ number: "+919999999999" });
      expect(res.status).toBe(true);
      expect(res.data).toEqual({ id: "d1", body: "+919999999999" });
    });

    it("should handle unique constraint error", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "user_1" },
      });
      (prisma.device.create as jest.Mock).mockRejectedValue(
        new Error("Unique constraint failed on the fields: (`body`)")
      );

      const res = await addDevice({ number: "+919999999999" });
      expect(res.status).toBe(false);
      expect(res.error).toEqual({ error: "Device with this number already exists" });
    });

    it("should handle general creation error", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "user_1" },
      });
      (prisma.device.create as jest.Mock).mockRejectedValue(new Error("DB error"));

      const res = await addDevice({ number: "+919999999999" });
      expect(res.status).toBe(false);
      expect(res.error).toEqual({ error: "DB error" });
    });
  });

  describe("deleteDevice", () => {
    it("should return error if device not found", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "user_1" },
      });
      (prisma.device.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await deleteDevice("invalid_id");
      expect(res.status).toBe(false);
      expect(res.error).toEqual({ message: "Device not found" });
    });

    it("should delete device if found", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue({
        user: { id: "user_1" },
      });
      (prisma.device.findFirst as jest.Mock).mockResolvedValue({ id: "dev_1" });
      (prisma.device.delete as jest.Mock).mockResolvedValue({ id: "dev_1" });

      const res = await deleteDevice("dev_1");
      expect(res.status).toBe(true);
    });
  });

  describe("logoutDevice", () => {
    it("should queue logout job", async () => {
      (prisma.device.findFirst as jest.Mock).mockResolvedValue({
        id: "dev_1",
        body: "+919999999999",
      });

      const res = await logoutDevice("dev_1");
      expect(res).toBe(true);
    });
  });
});
