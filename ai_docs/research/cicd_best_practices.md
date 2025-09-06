
# Research: CI/CD Best Practices for Turborepo and GitHub Actions

This document summarizes best practices for creating an efficient CI/CD pipeline for a Turborepo monorepo using GitHub Actions, focusing on caching, selective builds, and Docker image creation.

---

## 1. Caching Strategies

Effective caching is the most critical factor for achieving fast CI/CD builds in a monorepo. The goal is to avoid re-running tasks (like `install`, `build`, `test`) on code that has not changed.

### Remote Caching (Recommended)

This is Turborepo's most powerful feature. It shares a single cache for build artifacts across the entire team and, most importantly, across all CI/CD runs.

-   **How it works:** After a task is completed, Turborepo uploads the resulting files (`.next`, `dist`, etc.) and logs to a remote cache. Before running a task, it checks if the same task has been run on the same code before. If a cache entry exists, it downloads the artifacts instead of re-executing the task.
-   **Implementation:**
    -   Use a service like Vercel, which provides a zero-configuration remote cache.
    -   In GitHub Actions, set `TURBO_TOKEN` and `TURBO_TEAM` as secrets in your repository settings and expose them as environment variables in the workflow file.

### GitHub Actions Cache (Alternative)

If a dedicated remote cache service is not used, you can leverage the built-in GitHub Actions cache.

-   **How it works:** Use the `actions/cache` action to save and restore the `.turbo` directory, which contains the local cache artifacts.
-   **Limitation:** This cache is specific to the branch and runner type. It's less effective than a true remote cache because a CI run on a pull request will not benefit from a cache generated on the `main` branch after a previous merge.

---

## 2. Selective Builds and Task Execution

Selective building ensures that CI only runs tasks on the parts of the codebase that have actually changed, which is essential for efficiency in a monorepo.

### The `--filter` Flag

The `filter` flag allows you to run a command on a subset of your monorepo. A powerful feature for CI is filtering based on Git history.

-   **Command:** `turbo run build --filter="...[origin/main]"`
-   **How it works:** This command tells Turborepo to identify all packages that have changed in the current branch compared to the `origin/main` branch and run the `build` task only on those affected packages and their dependents. This is ideal for pull request workflows.

### The `turbo-ignore` Command

For more granular control, especially in deployment workflows, `turbo-ignore` is used.

-   **Use Case:** In a deployment workflow that runs on merge to `main`, you might want to build and push a Docker image for `wserver` only if its code has actually changed.
-   **How it works:** `turbo-ignore <app-name>` will exit with a status code of `0` if the app is unaffected or `1` if it is affected. This can be used in an `if` condition in a GitHub Actions step to conditionally run deployment logic.

---

## 3. Docker Image Creation

Building Docker images in a monorepo requires isolating a single application's code and dependencies.

### The `turbo prune` Command

This is the recommended way to prepare an application for containerization.

-   **Command:** `turbo prune --scope=<app-name> --docker`
-   **How it works:** This command creates a pruned version of your monorepo in an `out` directory. This directory contains:
    -   Only the source code for the specified app and its internal dependencies.
    -   A rewritten, minimal lockfile with only the necessary production dependencies.
    -   The `--docker` flag structures the output to optimize Docker's layer caching by separating package manifests (`json/`) from source code (`full/`).

### Multi-Stage Dockerfiles

Using a multi-stage `Dockerfile` is a best practice that works perfectly with the output of `turbo prune`.

-   **Stage 1: Pruner:** Runs `turbo prune` to create the isolated project.
-   **Stage 2: Installer:** Copies only the pruned package manifests and installs dependencies. This layer is highly cacheable.
-   **Stage 3: Builder:** Copies the source code and the installed `node_modules`, then builds the application.
-   **Stage 4: Runner:** A minimal final image that copies only the final build artifacts (e.g., the `dist` or `.next/standalone` directory) from the builder stage.
