# Botify 🚀

Botify is a modern WhatsApp automation system built with Next.js 15, with a worker that delivers queued messages over WhatsApp sessions.

## ✨ Features

- Authentication with BetterAuth (credentials + Google)
- Modern UI with Tailwind CSS & ShadCN
- Prisma + PostgreSQL data layer
- Media upload with static serving under `/media`
- Queue-based sending with BullMQ + Redis

## 🛠️ Tech Stack

- Framework: Next.js 15
- Worker: Node.js + BullMQ
- Database: PostgreSQL with Prisma ORM
- Styling: Tailwind CSS, ShadCN
- Redis for queues

## 🚀 Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment
Create a `.env` file based on `.example.env` and set required keys.

Key envs for media:

```
MEDIA_MAX_BYTES=10485760        # Max file size in bytes (default 10MB)
MEDIA_STORAGE_DIR=public/media   # Optional. Defaults to apps/web/public/media (relative to process.cwd())
```

In Docker compose, media is persisted via a volume and an absolute path:

```
services:
  app:
    environment:
      - MEDIA_STORAGE_DIR=/app/apps/web/public/media
    volumes:
      - media_data:/app/media
volumes:
  media_data:
```

### 3) Run database migrations

```bash
pnpm db:migrate:dev
```

### 4) Start development

```bash
pnpm dev
```

App runs at http://localhost:3000.

## Media Workflow

Preferred flow is upload → URL → queue.

- Upload: `POST /api/media/upload` (multipart form with `file`)
  - Returns JSON: `{ url, fileName, mimeType, size }`
- Serve: `GET /api/media/[id]` streams media with correct `Content-Type`.
- Use the returned `url` when queueing messages. Optionally supply `mediaType`, `mimeType`, and `fileName` to avoid extension-based inference.

## Message Send APIs

- JSON API: `POST /api/messages/send-message`
  - Body: `{ sender, number, text?, media?, mediaType?, mimeType?, fileName? }`
  - Requires API key with `messages: ["send"]` permission.

- Multipart API: `POST /api/messages/send`
  - Fields: `sender`, `to`, `messageType` (Text|Image|Video|Document), `content?`, `media?` (File)
  - Requires API key with `messages: ["send_media"]` for media types.
  - Saves file to `MEDIA_STORAGE_DIR`, queues with internal media URL, and passes `mediaType`, `mimeType`, `fileName` to the worker.

Both APIs accept text-only, media-only, or both.

## Deprecation Note

- Base64 `data:` URLs are still accepted for backward compatibility, but are deprecated. Prefer uploading media and sending by URL.

## Scripts

- Build: `pnpm build`
- Dev: `pnpm dev`
- Test: `pnpm test`
- Lint: `pnpm lint`

