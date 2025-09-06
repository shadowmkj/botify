
# Summary: Turborepo Official Docker Documentation

This document summarizes the key concepts from Turborepo's official documentation on how to efficiently containerize a monorepo application using Docker.

**Source:** [https://turborepo.org/docs/deployment/with-docker](https://turborepo.org/docs/deployment/with-docker)

---

## The Core Challenge

When Dockerizing a monorepo, the primary challenge is Docker's layer caching. A monorepo typically has a single root-level lockfile (`bun.lockb`, `pnpm-lock.yaml`, etc.). A change to any package for any application will alter this lockfile. In a naive Docker setup, this single file change would invalidate the entire dependency layer, forcing a re-installation of *all* dependencies for *all* apps, even those that were not affected. This leads to slow and inefficient builds.

## The Solution: `turbo prune`

Turborepo provides a powerful command, `turbo prune`, specifically designed to solve this problem.

- **What it does:** It analyzes the dependency graph of a specific application (or workspace) and generates a "pruned" version of the monorepo. This pruned copy contains only the source code and a minimal, rewritten lockfile that includes only the dependencies required for that specific application.

- **Key Benefit:** This allows you to build a Docker image for a single application from the monorepo without including unnecessary code or dependencies from other applications.

## The `--docker` Flag for Optimal Caching

For the most effective Docker layer caching, the documentation strongly recommends using the `--docker` flag:

```bash
turbo prune --scope=<your-app-name> --docker
```

This command creates an `out` directory with a special structure:

- `out/json/`: Contains all the `package.json` files required for the pruned dependency set.
- `out/full/`: Contains all the necessary source code files for the application and its internal dependencies.

This separation is the key to optimizing your `Dockerfile`. It allows you to create a dependency installation layer that only depends on the `package.json` files, and a separate source code layer. The dependency layer will only be rebuilt if the actual package versions change, not on every code commit.

## Recommended Multi-Stage Dockerfile Strategy

The official recommendation is a multi-stage `Dockerfile` that leverages the output of `turbo prune --docker`.

1.  **Pruner Stage:**
    - Starts from a base image.
    - Copies the entire monorepo.
    - Runs `turbo prune --scope=<your-app> --docker` to generate the `out` directory.

2.  **Installer Stage:**
    - Starts from a fresh base image.
    - Copies the `out/json` directory and the pruned lockfile from the `Pruner` stage.
    - Runs the package manager's install command (e.g., `bun install`). This creates a `node_modules` layer that is cached effectively.

3.  **Builder Stage:**
    - Copies the `node_modules` from the `Installer` stage.
    - Copies the source code from the `out/full` directory from the `Pruner` stage.
    - Runs the build command (e.g., `turbo run build --filter=<your-app>...`).

4.  **Final (Runner) Stage:**
    - Starts from a minimal production-ready image (e.g., `node:18-alpine`).
    - Copies only the final build artifacts (e.g., a `.next/standalone` directory) and the production `node_modules` from the `Builder` stage.
    - This results in the smallest, cleanest, and most secure final image for deployment.
