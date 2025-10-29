import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = 'nodejs'

function getStorageDir() {
  const raw = process.env.MEDIA_STORAGE_DIR;
  if (raw && path.isAbsolute(raw)) return raw;
  if (raw) return path.resolve(process.cwd(), raw);
  // default to Next public directory so files are served statically
  return path.join(process.cwd(), "public", "media");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 415 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const maxBytes = Number(process.env.MEDIA_MAX_BYTES || 10 * 1024 * 1024); // 10MB default
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      return NextResponse.json({ error: `File too large. Max ${maxBytes} bytes` }, { status: 413 });
    }

    const id = randomUUID();
    const dir = getStorageDir();
    await ensureDir(dir);

const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_");
const storedName = `${id}__${safeName}`;
const filePath = path.join(dir, storedName);

await fs.writeFile(filePath, Buffer.from(arrayBuffer));

const meta = {
  id,
  storedName,
  originalName: file.name || "upload",
  mimeType: file.type || "application/octet-stream",
  size: arrayBuffer.byteLength,
  createdAt: Date.now(),
};
// No meta file when serving statically; keep returning useful info

const reqUrl = new URL(request.url);
const url = `${reqUrl.origin}/media/${storedName}`;

return NextResponse.json({
  status: true,
  url,
  fileName: meta.originalName,
  mimeType: meta.mimeType,
  size: meta.size,
});
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}
