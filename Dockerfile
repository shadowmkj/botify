# Base Stage
FROM oven/bun:1 as base
RUN bun add -g turbo
WORKDIR /app

# Dependencies Stage
FROM base as deps
COPY package.json bun.lock turbo.json ./
COPY apps/socket/package.json ./apps/socket/
COPY apps/web/package.json ./apps/web/
COPY apps/wserver/package.json ./apps/wserver/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/types/package.json ./packages/types/
RUN bun install --frozen-lockfile

# Runner Stage
FROM base as runner
COPY . .
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000 3001
CMD ["turbo", "run", "dev"]
