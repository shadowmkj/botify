# --- Stage 1: The Builder ---
# Use the official Bun image which contains all the necessary tools.
FROM oven/bun:1.0 as builder
WORKDIR /app

# Copy only package manifests to leverage Docker layer caching.
# This layer is only rebuilt if dependency files change.
COPY bun.lockb ./
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/wserver/package.json ./apps/wserver/
COPY apps/socket/package.json ./apps/socket/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/types/package.json ./packages/types/

# Install all dependencies, including devDependencies needed for building.
RUN bun install --frozen-lockfile

# Copy the rest of the source code.
COPY . .

# Generate the Prisma client. This is required before building the app,
# as the generated client code is imported by the application source.
RUN bunx prisma generate

# Build all applications in the monorepo using Turborepo.
RUN bun run build

# --- Stage 2: The Production Image ---
# Start from a slim image for a smaller final footprint.
FROM oven/bun:1.0-slim
WORKDIR /app

# Copy a default .env file. This can be overridden by Docker Compose.
COPY .example.env ./.env

# Copy only production node_modules from the builder stage.
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema and migration files. These are needed at runtime
# by the entrypoint script to run `prisma migrate deploy`.
COPY --from=builder /app/packages/db/schema.prisma ./packages/db/
COPY --from=builder /app/packages/db/migrations ./packages/db/migrations

# Copy the compiled outputs of the backend applications.
COPY --from=builder /app/apps/wserver/dist ./apps/wserver/dist
COPY --from=builder /app/apps/socket/dist ./apps/socket/dist

# Copy the self-contained Next.js application.
COPY --from=builder /app/apps/web/.next/standalone ./apps/web/

# Copy and make the entrypoint script executable.
COPY start.sh .
RUN chmod +x ./start.sh

# Document that the container listens on port 3000.
EXPOSE 3000

# Set the command to run when the container starts.
CMD ["./start.sh"]