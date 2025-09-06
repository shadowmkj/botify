
# Summary: Community Guide by Jass.io on Turborepo & Docker

This document summarizes the key takeaways from a popular community guide on deploying Turborepo applications with Docker, reinforcing the official documentation with a practical, step-by-step perspective.

**Source:** [https://jass.io/guides/deploying-a-turborepo-with-docker](https://jass.io/guides/deploying-a-turborepo-with-docker)

---

## Core Problem & Solution

The guide identifies the same core problem as the official documentation: a monorepo's single lockfile (`package-lock.json`, etc.) breaks Docker layer caching, causing slow builds. The solution is Turborepo's `turbo prune` command, which isolates the dependencies and source code for a single application.

## Key Strategy: The Multi-Stage Dockerfile

The guide provides a clear, practical template for a multi-stage `Dockerfile` that is structured to maximize caching and minimize image size.

### The `--docker` Flag

This flag is highlighted as crucial. It splits the pruned output into two directories, which is the key to optimizing the Dockerfile layers:
- `./out/json`: Contains only the `package.json` files needed for dependency installation.
- `./out/full`: Contains the required source code for the application.

### Recommended Dockerfile Stages

The guide breaks the `Dockerfile` down into a clear, five-stage process:

1.  **`base` Stage:**
    -   A simple stage that starts from a base Node.js image (e.g., `node:18`).
    -   This can be used as the foundation for subsequent stages.

2.  **`prune` Stage:**
    -   Installs the `turbo` CLI.
    -   Copies the entire monorepo source code.
    -   Runs `turbo prune <app-name> --docker` to create the optimized `./out` directory.

3.  **`installer` Stage:**
    -   **Purpose:** To create a cached layer of `node_modules`.
    -   Copies *only* the `./out/json` directory (containing `package.json` files) and the pruned lockfile from the `prune` stage.
    -   Runs the dependency installation command (e.g., `npm install`, `pnpm install`).
    -   **Result:** This layer is only rebuilt by Docker when a dependency actually changes, not on every code change.

4.  **`builder` Stage:**
    -   **Purpose:** To compile the application source code.
    -   Copies the `node_modules` from the `installer` stage.
    -   Copies the application source code from the `./out/full` directory.
    -   Runs the build command, e.g., `turbo build --filter=<app-name>...`.

5.  **Final Runner Stage:**
    -   **Purpose:** To create the final, lightweight production image.
    -   Starts from a minimal base image (e.g., `node:18-alpine`).
    -   Copies only the built application artifacts (e.g., `.next/standalone` folder) from the `builder` stage.
    -   Sets the final `CMD` to run the application.

## Summary of Benefits

Following this structured approach provides two main advantages:

-   **Faster Builds:** Maximizes Docker's layer caching, so time-consuming dependency installations are not run on every build.
-   **Smaller Images:** Ensures the final production image is as small as possible, containing only the necessary runtime code.
