import { importContacts } from "@/actions/contact-import";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

jest.mock("@repo/db", () => ({
  prisma: {
    $transaction: jest.fn(),
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

describe("contact-import actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when unauthenticated", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue(null);

    const res = await importContacts({});
    expect(res).toEqual({ error: "Not authenticated", status: 401 });
  });

  it("should return 400 when input validation fails", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });

    const res = await importContacts({ groupName: "" });
    expect(res.status).toBe(400);
    expect(res.error).toContain("Error importing contacts");
  });

  it("should return 400 when contact list is empty", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });

    const res = await importContacts({
      groupName: "Test Group",
      contacts: [],
    });
    expect(res).toEqual({
      error: "CSV file must contain at least one contact.",
      status: 400,
    });
  });

  it("should successfully import contacts inside a transaction", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      const tx = {
        contactGroup: {
          create: jest.fn().mockResolvedValue({ id: "group_1" }),
        },
        contact: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return await cb(tx);
    });

    const res = await importContacts({
      groupName: "New Leads",
      contacts: [{ name: "Alice", phone: "+919876543210" }],
    });

    expect(res).toEqual({
      success: true,
      message: "Contacts imported successfully.",
      status: 200,
    });
  });

  it("should return 500 when transaction fails", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });

    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error("DB timeout"));

    const res = await importContacts({
      groupName: "New Leads",
      contacts: [{ name: "Alice", phone: "+919876543210" }],
    });

    expect(res).toEqual({
      error: "An unexpected error occurred.",
      status: 500,
    });
  });
});
