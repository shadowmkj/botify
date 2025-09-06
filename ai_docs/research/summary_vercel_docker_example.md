# Summary: Official Turborepo Docker Example

This document analyzes the deployment strategy demonstrated in the official `with-docker` example repository provided by the Turborepo team.

**Source:** [https://github.com/vercel/turborepo/tree/main/examples/with-docker](https://github.com/vercel/turborepo/tree/main/examples/with-docker)

---

## Overview of the Strategy

The example showcases the canonical, best-practice method for containerizing a single application from a monorepo. The strategy is centered on two core concepts: **pruning** the monorepo to isolate an application and using **multi-stage builds** to create a minimal, production-ready image.

## Key Concepts Demonstrated

### 1. Pruning for Isolation and Caching

The repository demonstrates the use of the `turbo prune --scope=<app-name> --docker` command. This is the foundation of the entire strategy.

-   **Isolation:** It creates an `out` directory containing only the source files, package manifests (`package.json`), and a pruned lockfile necessary for the specified application (e.g., `web`). This prevents changes in other apps (e.g., `docs`) from affecting the Docker build of the `web` app.
-   **Optimized Caching:** The `--docker` flag is used to split the output into `out/json` (for package manifests) and `out/full` (for source code). This allows the `Dockerfile` to create separate, highly-cacheable layers for dependency installation and source code, dramatically speeding up subsequent builds.

### 2. Multi-Stage Dockerfile

The example provides a `Dockerfile` within the `apps/web` directory that uses a multi-stage build to create the final image. The stages are logical and optimized:

-   **`pruner` Stage:** This initial stage is responsible for running the `turbo prune` command to create the isolated monorepo subset in the `out` directory.

-   **`installer` Stage:** This stage focuses solely on installing dependencies. It copies the pruned package manifests and lockfile from the `pruner` stage and runs `pnpm install`. This creates a `node_modules` layer that Docker can easily cache.

-   **`builder` Stage:** This stage builds the application. It copies the dependencies from the `installer` stage and the source code from the `pruner` stage, then runs the build command.

-   **`runner` Stage:** This is the final stage. It starts from a minimal base image (e.g., Debian) and copies only the essential artifacts from the `builder` stage. For the Next.js web app, this includes:
    -   The `.next/standalone` directory.
    -   The `.next/static` directory.
    -   The `public` folder.

### 3. Project and Dockerfile Structure

-   **Dockerfile Location:** The `Dockerfile` is located within the specific application's directory (`apps/web/Dockerfile`), not at the monorepo root. This allows each application to have its own specific build instructions.
-   **Build Context:** Despite the `Dockerfile`'s location, the Docker build command is intended to be run from the **root of the monorepo**. This is critical because Turborepo needs the full context of the repository to correctly prune and build the dependency graph.
-   **Standard Monorepo Layout:** The project follows the standard `apps` and `packages` directory structure, which is the conventional layout for Turborepo projects.