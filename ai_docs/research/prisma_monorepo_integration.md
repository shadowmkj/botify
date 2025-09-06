
# Research: Integrating Prisma in a Turborepo Monorepo

This document summarizes best practices for using Prisma ORM within a Turborepo monorepo, particularly in the context of Docker and CI/CD pipelines.

---

## 1. Centralized Prisma Package

The most critical best practice is to treat your database schema and client as a shared, internal package.

-   **Action:** Create a dedicated workspace, typically `packages/db`.
-   **Contents:**
    -   `prisma/schema.prisma`: The single source of truth for your database schema.
    -   `package.json`: This file should contain `prisma` as a `devDependency` and scripts for common tasks like `migrate`, `generate`, etc.
    -   `index.ts` (or similar): This file should export a singleton instance of the Prisma Client. This ensures that all applications in the monorepo share the same client configuration and connection pools.

**Example `packages/db/index.ts`:**
```typescript
import { PrismaClient } from '@prisma/client';

// This prevents hot-reloading from creating multiple instances of PrismaClient in development.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 2. Prisma Client Generation

The Prisma Client is generated based on your schema. This generation step is crucial and must be handled correctly within the monorepo.

-   **The Challenge:** The generated client code needs to be available in the `node_modules` of the applications that use it. The standard `prisma generate` command places the client in `node_modules/@prisma/client` within the `packages/db` workspace.
-   **The Solution:**
    1.  **Custom Output Path:** In `packages/db/schema.prisma`, configure the `output` location for the generated client to point to a local path within the `db` package itself.
        ```prisma
        generator client {
          provider = "prisma-client-js"
          output   = "./generated/client"
        }
        ```
    2.  **Package Exports:** In `packages/db/package.json`, use the `exports` field to make the generated client code available to other workspaces in the monorepo.
        ```json
        {
          "name": "@repo/db",
          "version": "0.0.0",
          "main": "./index.js",
          "types": "./index.d.ts",
          "exports": {
            "./generated/client": "./generated/client/index.js"
          },
          // ...
        }
        ```
    3.  **Build Script:** The `build` script in `packages/db/package.json` should simply be `prisma generate`.

-   **Turborepo Integration:** In the root `turbo.json`, ensure that the `build` tasks of your applications (e.g., `web`, `wserver`) depend on the `build` task of the `db` package. This guarantees that `prisma generate` is always run before your applications are built.
    ```json
    "build": {
      "dependsOn": ["^build", "@repo/db#build"]
    }
    ```

---

## 3. Handling Migrations and Schema in CI/CD

The `prisma` schema and migration files are critical artifacts that must be available in the final Docker image to run migrations.

-   **`turbo prune`:** When you run `turbo prune --scope=<app-name>`, Turborepo will automatically include `packages/db` as a dependency for your application, so the source files will be correctly copied.
-   **Dockerfile Strategy:**
    1.  **Builder Stage:** After installing dependencies, run `bun turbo run build --filter=<app-name>...`. Because of the dependency declared in `turbo.json`, this will automatically run `prisma generate` first.
    2.  **Runner Stage:** The final, lean image **must** contain the Prisma schema and migration files to run migrations at runtime. You must copy them from the builder stage.
        ```dockerfile
        # In the Runner Stage
        # Copy schema and migrations for runtime deployment
        COPY --from=builder /app/packages/db/prisma/schema.prisma ./packages/db/prisma/
        COPY --from=builder /app/packages/db/prisma/migrations ./packages/db/prisma/migrations
        ```
-   **Running Migrations:** The entrypoint script (`start.sh` or similar) in your Docker container should run `bunx prisma migrate deploy` before starting the application server. This command applies pending migrations and is safe to run on every container start.
