
# CI/CD Plan for the Botify Monorepo using GitHub Actions

This document outlines a comprehensive CI/CD strategy for the Botify monorepo, leveraging GitHub Actions. The plan is designed to be fast, efficient, and reliable, building upon best practices for Turborepo, Docker, and Prisma.

---

## Goals

-   **Speed:** Utilize Turborepo's Remote Caching and selective task execution to ensure CI runs are as fast as possible.
-   **Efficiency:** Only build and test the applications and packages that have changed.
-   **Reliability:** Automate testing, linting, and database client generation on every pull request.
-   **Selective Deployment:** On merges to `main`, only build and deploy Docker images for applications that were actually affected by the changes.
-   **Prisma Integration:** Correctly handle Prisma schema, client generation, and migrations throughout the entire CI/CD lifecycle.

---

### Phase 1: Codebase Adjustments for Prisma

To ensure Prisma works reliably in a monorepo and inside Docker, we need to make a small adjustment to the `packages/db` workspace.

**Action:**

1.  **Define a `build` script for the `db` package.** This script will be responsible for running `prisma generate`.
    -   **File:** `packages/db/package.json`
    ```json
    {
      "name": "@repo/db",
      "version": "1.0.0",
      "private": true,
      "main": "index.ts",
      "scripts": {
        "build": "prisma generate",
        "db:push": "prisma db push",
        "db:studio": "prisma studio"
      },
      // ... rest of the file
    }
    ```
2.  **Make application builds dependent on Prisma generation.** In the root `turbo.json`, we will ensure that `prisma generate` is always run before any application is built.
    -   **File:** `turbo.json`
    ```json
    {
      "$schema": "https://turbo.build/schema.json",
      "pipeline": {
        "build": {
          "dependsOn": ["^build", "@repo/db#build"],
          "outputs": ["dist/**", ".next/**"]
        },
        // ... rest of the file
      }
    }
    ```

---

### Phase 2: Continuous Integration (CI) Workflow

This workflow runs on every pull request. It will now also ensure the Prisma client is generated correctly.

**Action:** Create/overwrite `.github/workflows/ci.yml`.

```yaml
# .github/workflows/ci.yml

name: Continuous Integration

on:
  pull_request:
    branches:
      - main

jobs:
  ci:
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Cache bun dependencies
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run Linting on Affected Workspaces
        run: bun turbo run lint --filter="...[origin/main]"

      - name: Run Tests on Affected Workspaces
        run: bun turbo run test --filter="...[origin/main]"

      - name: Run Builds on Affected Workspaces
        # This will now automatically run `prisma generate` first due to the
        # dependency in turbo.json, ensuring the client is available for builds.
        run: bun turbo run build --filter="...[origin/main]"
```

---

### Phase 3: Continuous Deployment (CD) Workflow

This workflow runs on `push` to `main`. It will build and push Docker images that are correctly configured to handle Prisma migrations at runtime.

**Action:** Create/overwrite `.github/workflows/cd.yml`.

```yaml
# .github/workflows/cd.yml

name: Continuous Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy-web:
    name: Deploy Web App
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    if: "contains(github.event.head_commit.message, '[force deploy]') || !contains(github.event.head_commit.message, '[skip deploy]')"

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/iamshadow666/botify-web

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            APP_NAME=web
```

---

### Phase 4: The Prisma-Aware `Dockerfile`

This single, optimized `Dockerfile` will now correctly handle Prisma client generation during the build and include the necessary schema and migration files in the final image.

**Action:** Overwrite the root `Dockerfile` with the following content.

```dockerfile
# Dockerfile

# --- Base Stage ---
FROM oven/bun:1.0-slim as base
WORKDIR /app
ENV BUN_INSTALL_CACHE_DIR=~/.bun/install/cache

# --- Pruner Stage ---
FROM base as pruner
COPY . .
ARG APP_NAME
RUN bun turbo prune --scope=${APP_NAME} --docker

# --- Installer Stage ---
FROM base as installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/bun.lockb ./bun.lockb
RUN bun install --frozen-lockfile

# --- Builder Stage ---
FROM base as builder
ARG APP_NAME
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ ./
# This build step now implicitly runs `prisma generate` first.
RUN bun turbo run build --filter=${APP_NAME}...

# --- Runner Stage ---
FROM base as runner
WORKDIR /app
ARG APP_NAME

# Copy production node_modules
COPY --from=installer /app/node_modules ./node_modules

# Copy the Prisma schema and migration files for runtime use.
# This is CRITICAL for running `prisma migrate deploy`.
COPY --from=builder /app/packages/db/prisma/schema.prisma ./packages/db/prisma/
COPY --from=builder /app/packages/db/prisma/migrations ./packages/db/prisma/migrations

# Copy the built application code
COPY --from=builder /app/apps/${APP_NAME}/dist ./apps/${APP_NAME}/dist
COPY --from=builder /app/apps/web/.next/standalone ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy and use the robust start script
COPY start.sh .
RUN chmod +x ./start.sh

# Expose the port and set the entrypoint
EXPOSE 3000
CMD ["./start.sh"]
```

### Phase 5: The Prisma-Aware Startup Script

The `start.sh` script needs to be updated to run migrations before starting the application.

**Action:** Create/overwrite `start.sh` in the root directory.

```bash
#!/bin/bash
set -e

echo "Starting Botify..."

# 1. Run database migrations
# This command is safe to run on every start. It applies pending
# migrations and does nothing if the database is up-to-date.
echo "Running database migrations..."
bunx prisma migrate deploy

# 2. Start the correct application based on an environment variable
# The APP_NAME will be passed into the container at runtime.
echo "Starting application: $APP_NAME"

if [ "$APP_NAME" = "web" ]; then
  exec node apps/web/server.js
elif [ "$APP_NAME" = "wserver" ]; then
  exec node apps/wserver/dist/index.js
elif [ "$APP_NAME" = "socket" ]; then
  exec node apps/socket/dist/server.js
else
  echo "Error: Unknown APP_NAME: $APP_NAME"
  exit 1
fi
```
