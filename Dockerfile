# Stage 1: Builder
FROM node:24-alpine AS builder

# Install dependencies
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the monorepo source code
COPY . .

# Build the applications
RUN pnpm turbo run build

# --- Stage 2: Runner ---
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm turbo
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000 3001

CMD ["pnpm", "start"]
