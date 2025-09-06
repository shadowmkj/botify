# 1. Builder
FROM oven/bun:1 as builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY apps/wserver/package.json ./apps/wserver/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN bun install --frozen-lockfile

# Build the wserver app
COPY . .
RUN bun turbo run build --filter=wserver

# 2. Runner
FROM node:20-slim as runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/wserver/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/wserver/package.json ./package.json

CMD ["node", "dist/index.js"]
