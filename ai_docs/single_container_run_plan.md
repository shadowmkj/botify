# Plan to Run the Entire Application in a Single Container

This document outlines the plan to modify the project to run the entire application (web, socket, and wserver with its worker) in a single Docker container with a single command.

## Summary

The goal is to have a single command to start all services. The current `turbo run dev` command does not start the `wserver` worker. The plan is to modify the `dev` script in `apps/wserver/package.json` to start both the main server and the worker. Then, a `Dockerfile` and `compose.yaml` will be created to build and run the application.

## `package.json` Changes

### `apps/wserver/package.json`

The `dev` script will be modified to run both the main server and the worker concurrently.

**Current `dev` script:**
`"dev": "ts-node-dev --respawn --transpile-only src/index.ts"`

**Proposed `dev` script:**
`"dev": "ts-node-dev --respawn --transpile-only src/index.ts & ts-node-dev --respawn --transpile-only src/worker.ts"`

## `Dockerfile`

A multi-stage `Dockerfile` will be created to build the application.

```dockerfile
# Base Stage
FROM oven/bun:1 as base
RUN apt-get update -y && apt-get install -y openssl
RUN bun add -g turbo
WORKDIR /app

# Dependencies Stage
FROM base as deps
COPY package.json bun.lock turbo.json ./
COPY apps/socket/package.json ./apps/socket/
COPY apps/web/package.json ./apps/web/
COPY apps/wserver/package.json ./apps/wserver/
COPY packages/db/package.json ./packages/db/
COPY packages/db/schema.prisma ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN bun install --frozen-lockfile

# Build Stage
FROM deps as builder
COPY . .
RUN turbo run build

# Runner Stage
FROM base as runner
COPY --from=builder /app .
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000 3001
CMD ["bun", "run", "dev"]
```

## `compose.yaml`

A `compose.yaml` file will be created to run the application and its dependencies.

```yaml
services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - postgres
      - redis
    ports:
      - '3000:3000'
      - '3001:3001'
    env_file:
      - .env
    volumes:
      - .:/app

volumes:
  postgres_data:
  redis_data:
```
