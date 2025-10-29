# Botify Web

This app provides the dashboard and APIs for Botify.

## Media Upload + Send

- Upload via `POST /api/media/upload` with multipart field `file`. Response includes `{ url, fileName, mimeType, size }`.
- Files are saved under `public/media`, so the returned `url` is a static path like `/media/<id>__name.ext`.
- Legacy `GET /api/media/[id]` remains for compatibility and now redirects to the static URL.

Smoke test examples:

- Upload:
  - `curl -F file=@/path/to/sample.jpg http://localhost:3000/api/media/upload`
- Static Serve:
  - The upload response contains `url` like `http://localhost:3000/media/<id>__sample.jpg`.
- Legacy redirect:
  - `curl -i http://localhost:3000/api/media/<id>` (302 redirect to `/media/<id>__...`)

## Message APIs

- JSON: `POST /api/messages/send-message` with `{ sender, number, text?, media?, mediaType?, mimeType?, fileName? }`.
- Multipart: `POST /api/messages/send` with fields `sender`, `to`, `messageType` (Text|Image|Video|Document), `content?`, `media?` (File). Saves file and queues with its internal URL.

Both endpoints accept text-only, media-only, or both.

## Env Keys

- `MEDIA_MAX_BYTES` (bytes, default 10MB)
- `MEDIA_STORAGE_DIR` (path where uploads are stored)

