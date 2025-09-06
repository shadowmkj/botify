# Dockerfile

# --- Base Stage ---
# Use the official Node.js image which includes npm and npx.
FROM node:20-slim as base
WORKDIR /app

# Install pnpm and turbo globally
RUN npm install -g pnpm turbo

# --- Pruner Stage ---
# This stage selectively copies only the files needed to compute the dependency tree
# and run `turbo prune`.
FROM base as pruner
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

# Prune the monorepo to get only the files needed for the target application.
ARG APP_NAME
RUN turbo prune --scope=${APP_NAME} --docker

# --- Installer Stage ---
# This stage installs dependencies based on the pruned workspace.
FROM base as installer
WORKDIR /app

# Copy the pruned package manifests and lockfile.
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production-only dependencies.
RUN pnpm install --frozen-lockfile

# --- Builder Stage ---
# This stage builds the actual application code.
FROM base as builder
WORKDIR /app
ARG APP_NAME

# Copy dependencies and the pruned source code.
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ ./

# Build the application.
RUN turbo run build --filter=${APP_NAME}...

# --- Runner Stage ---
# This is the final, minimal production image.
FROM base as runner
WORKDIR /app
ARG APP_NAME

# Copy production node_modules from the installer stage.
COPY --from=installer /app/node_modules ./node_modules

# Copy the Prisma schema and migration files for runtime use.
COPY --from=builder /app/packages/db/prisma/schema.prisma ./packages/db/prisma/
COPY --from=builder /app/packages/db/prisma/migrations ./packages/db/prisma/migrations

# Copy the built application code.
COPY --from=builder /app/apps/web/.next/standalone ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy and use the robust start script.
COPY start.sh .
RUN chmod +x ./start.sh

EXPOSE 3000
CMD ["./start.sh"]