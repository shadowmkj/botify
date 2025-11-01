import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = 'nodejs'

function getStorageDir() {
  const raw = process.env.MEDIA_STORAGE_DIR;
  if (raw && path.isAbsolute(raw)) return raw;
  if (raw) return path.resolve(process.cwd(), raw);
  return path.join(process.cwd(), "public", "media");
}

async function findStoredName(id: string): Promise<string | null> {
  const dir = getStorageDir();
  try {
    const entries = await fs.readdir(dir);
    const match = entries.find((name) => name.startsWith(`${id}__`));
    return match || null;
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    console.error("Media dir read error", { dir, code });
    return null;
  }
}

export async function GET(req: Request, arg: unknown) {
  const { params } = arg as { params: { id: string } };
  const id = params.id;
  const dir = getStorageDir();
  const storedName = await findStoredName(id);
  if (!storedName) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const filePath = path.join(dir, storedName);
  try {
    await fs.access(filePath);
    const reqUrl = new URL(req.url)
    return NextResponse.redirect(`${reqUrl.origin}/media/${storedName}`, 302)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    console.error("Media file access error", { id, filePath, code });
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function HEAD(req: Request, arg: unknown) {
  const { params } = arg as { params: { id: string } };
  const id = params.id;
  const storedName = await findStoredName(id);
  if (!storedName) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const reqUrl = new URL(req.url)
  return NextResponse.redirect(`${reqUrl.origin}/media/${storedName}`, 302)
}
