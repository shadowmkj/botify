# Plan for Production Docker Environment

This document outlines the plan to dockerize the Botify application for a production environment.

## Summary

The goal is to create a production-ready Docker image for the application. This involves building the application and creating a minimal image with only the necessary artifacts and production dependencies. The entire application will run in a single container, started by a single command.

## `start.sh` Script

A `start.sh` script will be created to run all the services in the single container.

```sh
#!/bin/sh
node apps/socket/dist/server.js &
node apps/wserver/dist/index.js &
node apps/wserver/dist/worker.js &
cd apps/web && bun run start
```

## Production `Dockerfile`

A multi-stage `Dockerfile` will be created for the production build. It will be named `Dockerfile.prod`.

```dockerfile
# Builder Stage
FROM oven/bun:1 as builder
RUN apt-get update -y && apt-get install -y openssl
RUN bun add -g turbo
WORKDIR /app
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
COPY . .
RUN turbo run build

# Runner Stage
FROM node:20-slim as runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/socket/dist ./apps/socket/dist
COPY --from=builder /app/apps/wserver/dist ./apps/wserver/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/start.sh .
RUN chmod +x start.sh
EXPOSE 3000 3001
CMD ["./start.sh"]
```

## Production `compose.yaml`

A `compose.yaml` file will be created to run the application and its dependencies in a production environment.

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
      dockerfile: Dockerfile.prod
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
  postgres_data:
  redis_data:
```