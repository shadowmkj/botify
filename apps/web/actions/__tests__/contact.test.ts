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
    },
    contactGroup: {
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

describe("contact actions", () => {
  beforeEach(() => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add contact", async () => {
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

  it("should delete contact", async () => {
    await deleteContact({ id: "c1" });
    expect(prisma.contact.delete).toHaveBeenCalledWith({
      where: { id: "c1" },
    });
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

  it("should delete contact group", async () => {
    await deleteContactGroup({ id: "g1" });
    expect(prisma.contactGroup.delete).toHaveBeenCalledWith({
      where: { id: "g1" },
    });
  });
});
