
# Dockerfile

# --- Base Stage ---
# Sets up the basic environment and installs bun.
FROM oven/bun:1.0-slim as base
WORKDIR /app
ENV BUN_INSTALL_CACHE_DIR=~/.bun/install/cache

# --- Pruner Stage ---
# Responsible for creating the pruned, isolated monorepo subset.
FROM base as pruner
COPY . .
# Prune the monorepo to get only the files needed for the target app.
# The APP_NAME is passed in as a build argument from the GitHub Actions workflow.
ARG APP_NAME
RUN bun turbo prune --scope=${APP_NAME} --docker

# --- Installer Stage ---
# Installs dependencies based on the pruned lockfile. This layer is highly cacheable.
FROM base as installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/bun.lockb ./bun.lockb
RUN bun install --frozen-lockfile

# --- Builder Stage ---
# Builds the actual application code.
FROM base as builder
ARG APP_NAME
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ ./
# This build step now implicitly runs `prisma generate` first.
RUN bun turbo run build --filter=${APP_NAME}...

# --- Runner Stage ---
# Creates the final, minimal production image.
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
