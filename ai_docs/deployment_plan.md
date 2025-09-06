# Deployment Plan: Self-Hosting Botify with Docker (Detailed)

This document provides a detailed, phased approach to containerizing the Botify application and orchestrating it with dependent services using Docker. Each step includes an explanation of what is being done and why it is necessary.

## Goal

- **Single Container:** Build one optimized Docker image for the entire application stack (Next.js, `wserver`, `socket`) to simplify deployment and management.
- **Orchestration:** Use Docker Compose to reliably manage the startup and networking of the application container, a PostgreSQL database, and a Redis instance.
- **Production Ready:** Create a robust and repeatable deployment process that handles database migrations and environment configuration securely.
- **Standalone Next.js:** Leverage the Next.js standalone output feature to create a minimal, production-optimized build artifact, resulting in a smaller and more secure Docker image.

---

### Phase 1: Codebase Configuration

**Objective:** Prepare the Next.js frontend for containerization by enabling the optimal build output.

**1. Configure Next.js for Standalone Output**

- **Action:** Modify `apps/web/next.config.ts` to add the `output: 'standalone'` configuration.

```typescript
// apps/web/next.config.ts
import { fileURLToPath } from 'url';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // <-- Add this line
  experimental: {
    outputFileTracingRoot: path.join(process.cwd(), '../../'),
  },
  // ... other configurations
};

export default nextConfig;
```

- **Why this is needed:**
    - By default, a Next.js production build requires the entire `node_modules` directory and source code to be present to run.
    - The `output: 'standalone'` option tells Next.js to perform a dependency trace during the build. It creates a new folder at `apps/web/.next/standalone` containing only the essential files needed to run the application in production: the server entrypoint, minimal `node_modules`, and required assets.
    - This is crucial for Docker because it allows us to build a much smaller final image, copying only the standalone folder instead of the entire monorepo source and a full `node_modules` directory.
    - `outputFileTracingRoot` is essential in a monorepo. It tells Next.js to trace dependencies starting from the root of the monorepo (`../../` from `apps/web`), ensuring that shared packages from the `packages/` directory are correctly included in the standalone output.

---

### Phase 2: Dockerization

**Objective:** Define the build process for the application image using a `Dockerfile` and create a startup script to run the services within the container.

**1. Create a Production Dockerfile (`Dockerfile`)**

- **Action:** Create a new `Dockerfile` in the project root. This file defines a multi-stage build process.

- **Why a multi-stage build is used:**
    - A multi-stage build separates the build environment from the final runtime environment.
    - The first stage, `builder`, is a larger image that contains all the tools and development dependencies needed to compile the application (e.g., TypeScript, ESLint).
    - The final stage is a much smaller, "slim" image that only contains the compiled application code and the minimal dependencies needed to run it. This reduces the final image size and attack surface, which is a security best practice.

```dockerfile
# Dockerfile

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
```

**2. Create an Entrypoint Script (`start.sh`)**

- **Action:** Create a `start.sh` file in the project root.

```bash
#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting Botify..."

# 1. Run database migrations
echo "Running database migrations..."
# `migrate deploy` is designed for production. It applies pending
# migrations and fails if the database is not in a valid state.
# It does not generate new migrations or prompt for input.
bunx prisma migrate deploy

# 2. Start backend services in the background
echo "Starting backend services..."
# The '&' runs these commands as background processes, allowing the
# script to continue to the next line without waiting for them to finish.
node apps/wserver/dist/index.js &
node apps/socket/dist/server.js &

# 3. Start the Next.js application in the foreground
echo "Starting Next.js frontend..."
# `exec` replaces the shell process with the Node.js process. This makes
# the Next.js server the main process (PID 1) of the container, allowing
# it to receive signals like SIGTERM directly for graceful shutdowns.
exec node apps/web/server.js
```

---

### Phase 3: Orchestration with Docker Compose

**Objective:** Define and configure all the application's services (`app`, `postgres`, `redis`) so they can be managed as a single unit.

- **Action:** Replace the content of `compose.yaml`.

```yaml
# compose.yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-botify}
    volumes:
      # This persists database data on the host machine, so data is not
      # lost when the container is stopped or removed.
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      # Persists Redis data.
      - redis_data:/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      # This ensures that the `postgres` and `redis` services are started
      # before the `app` service is started.
      - postgres
      - redis
    env_file:
      # Loads environment variables from the .env file into the container.
      - .env

# Named volumes are managed by Docker.
volumes:
  postgres_data:
  redis_data:
```

---

### Phase 4: Build and Deploy

**Objective:** Provide clear, step-by-step instructions to build the image and launch the application stack.

**1. Create a `.env` file**

- **Action:** Copy the example environment file.
  ```bash
  cp .example.env .env
  ```
- **Action:** Edit the `.env` file to use Docker service names.
- **Why this is needed:**
    - Within the Docker network created by Compose, containers can communicate with each other using their service names as hostnames (e.g., `postgres`, `redis`).
    - `localhost` inside the `app` container refers to the `app` container itself, not the other services. You must use the service names for inter-container communication.

  ```env
  # .env

  # ... other variables

  # Use the service name 'postgres' as the host, not 'localhost'
  DATABASE_URL="postgresql://user:password@postgres:5432/botify?sslmode=disable"

  # Use the service name 'redis' as the host
  REDIS_HOST=redis
  REDIS_PORT=6379

  # ... other variables
  ```

**2. Build and Run with Docker Compose**

- **Action:** Run the `up` command.
  ```bash
  docker-compose up --build -d
  ```
- **Command Breakdown:**
    - `docker-compose up`: Creates and starts all services defined in `compose.yaml`.
    - `--build`: Forces Docker Compose to rebuild the `app` image using `Dockerfile`. This is necessary after making any changes to the source code or the Dockerfile.
    - `-d` (detached): Runs the containers in the background and returns control of your terminal.

---

### Phase 5: Maintenance and Verification

**Objective:** Explain common operational tasks like checking logs, applying updates, and stopping the application.

**1. View Logs**

- **Command:**
  ```bash
  docker-compose logs -f app
  ```
- **Explanation:**
    - `logs`: Fetches the logs from the specified service.
    - `-f` or `--follow`: Streams the logs in real-time, which is useful for debugging.

**2. Applying New Database Migrations**

- **Explanation:** The deployment workflow separates migration *creation* from migration *application*.
    1.  **Development:** You create new migrations in your local development environment using `bunx prisma migrate dev --name <migration_name>`. This generates a new SQL migration file in the `packages/db/migrations` directory.
    2.  **Deployment:** You commit this new migration file to version control. When you run `docker-compose up --build -d`, the new migration file is copied into the image. The `start.sh` script then automatically applies it to the production database via the `prisma migrate deploy` command.

**3. Stopping the Application**

- **Command:**
  ```bash
  docker-compose down
  ```
- **Explanation:** This command stops and removes the containers. Your database and Redis data will be preserved because it is stored in Docker-managed volumes (`postgres_data`, `redis_data`).