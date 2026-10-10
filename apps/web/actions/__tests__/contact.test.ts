import {
  addContact,
  deleteContact,
  addContactGroup,
  deleteContactGroup,
} from "@/actions/contact";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

jest.mock("@repo/db", () => ({
  prisma: {
    contact: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    contactGroup: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
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

describe("contact actions", () => {
  beforeEach(() => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });
    (prisma.contactGroup.findFirst as jest.Mock).mockResolvedValue({
      id: "g1",
      userId: "user_1",
    });
    (prisma.contact.findFirst as jest.Mock).mockResolvedValue({
      id: "c1",
      userId: "user_1",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addContact", () => {
    it("should throw error if unauthenticated", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(
        addContact({ name: "Bob", phone: "+919999999999", groupId: "g1" })
      ).rejects.toThrow("Not authenticated");
    });

    it("should throw error if group not found or unauthorized", async () => {
      (prisma.contactGroup.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        addContact({ name: "Bob", phone: "+919999999999", groupId: "g1" })
      ).rejects.toThrow("Contact group not found");
    });

    it("should add contact when authorized", async () => {
      await addContact({ name: "Bob", phone: "+919999999999", groupId: "g1" });
      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: {
          name: "Bob",
          phone: "+919999999999",
          userId: "user_1",
          contactGroupId: "g1",
        },
      });
    });
  });

  describe("deleteContact", () => {
    it("should throw error if unauthenticated", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(deleteContact({ id: "c1" })).rejects.toThrow("Not authenticated");
    });

    it("should throw error if contact not found for user", async () => {
      (prisma.contact.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(deleteContact({ id: "c1" })).rejects.toThrow("Contact not found");
    });

    it("should delete contact when authorized", async () => {
      await deleteContact({ id: "c1" });
      expect(prisma.contact.delete).toHaveBeenCalledWith({
        where: { id: "c1" },
      });
    });
  });

  describe("addContactGroup", () => {
    it("should throw error if unauthenticated", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(addContactGroup({ name: "VIP" })).rejects.toThrow("Not authenticated");
    });

    it("should add contact group", async () => {
      await addContactGroup({ name: "VIP Customers" });
      expect(prisma.contactGroup.create).toHaveBeenCalledWith({
        data: {
          name: "VIP Customers",
          userId: "user_1",
        },
      });
    });
  });

  describe("deleteContactGroup", () => {
    it("should throw error if unauthenticated", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(deleteContactGroup({ id: "g1" })).rejects.toThrow("Not authenticated");
    });

    it("should throw error if group not found for user", async () => {
      (prisma.contactGroup.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(deleteContactGroup({ id: "g1" })).rejects.toThrow("Contact group not found");
    });

    it("should delete contact group when authorized", async () => {
      await deleteContactGroup({ id: "g1" });
      expect(prisma.contactGroup.delete).toHaveBeenCalledWith({
        where: { id: "g1" },
      });
    });
  });
});
