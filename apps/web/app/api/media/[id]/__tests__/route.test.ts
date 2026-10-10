import { GET, HEAD } from "../route";
import { promises as fs } from "fs";

jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn(),
    access: jest.fn(),
  },
}));

describe("media [id] API route", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/media/[id]", () => {
    it("should redirect when media file is found and accessible", async () => {
      (fs.readdir as jest.Mock).mockResolvedValue(["media123__sample.png", "other_file.jpg"]);
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const req = new Request("http://localhost:3000/api/media/media123");
      const res = await GET(req, { params: Promise.resolve({ id: "media123" }) });

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/media/media123__sample.png");
    });

    it("should return 404 when no file matches the id", async () => {
      (fs.readdir as jest.Mock).mockResolvedValue(["different_media__sample.png"]);

      const req = new Request("http://localhost:3000/api/media/media123");
      const res = await GET(req, { params: Promise.resolve({ id: "media123" }) });

      expect(res.status).toBe(404);
    });

    it("should return 404 when readdir throws an error", async () => {
      (fs.readdir as jest.Mock).mockRejectedValue(new Error("ENOENT"));

      const req = new Request("http://localhost:3000/api/media/media123");
      const res = await GET(req, { params: Promise.resolve({ id: "media123" }) });

      expect(res.status).toBe(404);
    });

    it("should return 404 when file exists in directory list but fs.access fails", async () => {
      (fs.readdir as jest.Mock).mockResolvedValue(["media123__sample.png"]);
      (fs.access as jest.Mock).mockRejectedValue(new Error("EACCES"));

      const req = new Request("http://localhost:3000/api/media/media123");
      const res = await GET(req, { params: Promise.resolve({ id: "media123" }) });

      expect(res.status).toBe(404);
    });
  });

  describe("HEAD /api/media/[id]", () => {
    it("should redirect when media file is found", async () => {
      (fs.readdir as jest.Mock).mockResolvedValue(["media123__sample.png"]);

      const req = new Request("http://localhost:3000/api/media/media123");
      const res = await HEAD(req, { params: Promise.resolve({ id: "media123" }) });

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/media/media123__sample.png");
    });

    it("should return 404 when media file is not found", async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([]);

      const req = new Request("http://localhost:3000/api/media/media123");
      const res = await HEAD(req, { params: Promise.resolve({ id: "media123" }) });

      expect(res.status).toBe(404);
    });
  });
});
