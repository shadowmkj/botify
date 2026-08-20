# Stage 1: Builder
FROM node:26-alpine AS builder

# Install dependencies
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Enable Corepack and pin pnpm version from repo
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the monorepo source code
COPY . .

# Install after copying full workspace so prisma + client are present
RUN pnpm install --frozen-lockfile

# Generate Prisma client using workspace filter
RUN pnpm --filter @repo/db exec prisma generate

# Build the applications
RUN pnpm turbo run build

# --- Stage 2: Runner ---
FROM node:26-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Enable Corepack and pin pnpm version
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

COPY --from=builder /app .
EXPOSE 3000 3001

CMD ["pnpm", "start"]
