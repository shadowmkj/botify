import { PUT, DELETE } from "@/app/api/templates/[id]/route";
import { GET, POST } from "@/app/api/templates/route";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

jest.mock("@repo/db", () => ({
  prisma: {
    messageTemplate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

describe("templates API routes", () => {
  beforeEach(() => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/templates", () => {
    it("should return 401 when unauthorized", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("should return user templates", async () => {
      (prisma.messageTemplate.findMany as jest.Mock).mockResolvedValue([
        { id: "t1", name: "Welcome", userId: "user_1" },
      ]);
      const res = await GET();
      expect(res.status).toBe(200);
      expect(prisma.messageTemplate.findMany).toHaveBeenCalledWith({
        where: { userId: "user_1" },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("POST /api/templates", () => {
    it("should return 401 when unauthorized", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      const req = new Request("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({ name: "T1", content: "Hi", type: "Text" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("should return 400 if fields are missing", async () => {
      const req = new Request("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({ name: "T1" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should create a template for authenticated user", async () => {
      (prisma.messageTemplate.create as jest.Mock).mockResolvedValue({
        id: "t1",
        name: "T1",
        content: "Hello",
        type: "Text",
        userId: "user_1",
      });

      const req = new Request("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({ name: "T1", content: "Hello", type: "Text" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.messageTemplate.create).toHaveBeenCalledWith({
        data: {
          name: "T1",
          content: "Hello",
          type: "Text",
          userId: "user_1",
        },
      });
    });
  });

  describe("PUT /api/templates/[id]", () => {
    it("should return 401 when unauthorized", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      const req = new Request("http://localhost/api/templates/t1", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: "t1" }) });
      expect(res.status).toBe(401);
    });

    it("should return 404 when template does not belong to user", async () => {
      (prisma.messageTemplate.findFirst as jest.Mock).mockResolvedValue(null);
      const req = new Request("http://localhost/api/templates/t1", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: "t1" }) });
      expect(res.status).toBe(404);
    });

    it("should update template when valid", async () => {
      (prisma.messageTemplate.findFirst as jest.Mock).mockResolvedValue({
        id: "t1",
        userId: "user_1",
      });
      (prisma.messageTemplate.update as jest.Mock).mockResolvedValue({
        id: "t1",
        name: "Updated Name",
      });

      const req = new Request("http://localhost/api/templates/t1", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: "t1" }) });
      expect(res.status).toBe(200);
      expect(prisma.messageTemplate.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { name: "Updated Name" },
      });
    });
  });

  describe("DELETE /api/templates/[id]", () => {
    it("should return 401 when unauthorized", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      const req = new Request("http://localhost/api/templates/t1", {
        method: "DELETE",
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: "t1" }) });
      expect(res.status).toBe(401);
    });

    it("should return 404 when template does not belong to user", async () => {
      (prisma.messageTemplate.findFirst as jest.Mock).mockResolvedValue(null);
      const req = new Request("http://localhost/api/templates/t1", {
        method: "DELETE",
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: "t1" }) });
      expect(res.status).toBe(404);
    });

    it("should delete template when owned by user", async () => {
      (prisma.messageTemplate.findFirst as jest.Mock).mockResolvedValue({
        id: "t1",
        userId: "user_1",
      });
      (prisma.messageTemplate.delete as jest.Mock).mockResolvedValue({
        id: "t1",
      });

      const req = new Request("http://localhost/api/templates/t1", {
        method: "DELETE",
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: "t1" }) });
      expect(res.status).toBe(200);
      expect(prisma.messageTemplate.delete).toHaveBeenCalledWith({
        where: { id: "t1" },
      });
    });
  });
});
