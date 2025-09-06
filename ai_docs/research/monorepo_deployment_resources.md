# Guide: Deploying Monorepos with Docker

This document synthesizes best practices and key resources for containerizing and deploying monorepo applications, particularly those using Turborepo and Next.js.

---

## 📚 Key Documentation & Guides

These official documents and community guides provide the foundational knowledge for understanding the "why" behind modern monorepo deployment strategies.

1.  **Turborepo: Dockerizing a Monorepo**
    - **Link:** [Turborepo Docs - Dockerizing a Monorepo](https://turborepo.org/docs/deployment/with-docker)
    - **Summary:** The official guide from the Turborepo team. It explains how to create a pruned subset of your monorepo for more efficient and secure image building.

2.  **Next.js: Docker Image Deployment**
    - **Link:** [Next.js Docs - Docker Image](https://nextjs.org/docs/pages/building-your-application/deploying/docker)
    - **Summary:** This guide details the critical `output: 'standalone'` feature, which is essential for creating minimal, production-optimized Next.js images. It drastically reduces image size by including only necessary files.

3.  **Community Guide: Deploying a Turborepo with Docker**
    - **Link:** [jass.io - Deploying a Turborepo with Docker](https://jass.io/guides/deploying-a-turborepo-with-docker)
    - **Summary:** An excellent step-by-step blog post that provides a practical walkthrough of the entire process. It's a great supplement to the official documentation, with detailed explanations for each `Dockerfile` instruction.

---

## 📦 Example Repositories

Studying working code is the fastest way to learn. These repositories serve as fantastic, real-world references.

1.  **Official Turborepo Docker Example**
    - **Link:** [github.com/vercel/turborepo/tree/main/examples/with-docker](https://github.com/vercel/turborepo/tree/main/examples/with-docker)
    - **Why it's a key resource:** This is the canonical example from the Turborepo team. It demonstrates the recommended patterns, including multi-stage builds and leveraging Turborepo's remote caching within a Docker environment.

2.  **Shadcn/ui's Taxonomy Project**
    - **Link:** [github.com/shadcn-ui/taxonomy](https://github.com/shadcn-ui/taxonomy)
    - **Why it's a great reference:** This is a full-stack, production-grade Next.js 13 application. It provides a practical look at how modern concepts are applied in a complex, real-world monorepo.

---

## 🚀 Core Deployment Concepts

To effectively deploy a monorepo, it is essential to understand these four core concepts.

### 1. Monorepo-Aware Dockerfiles

A Dockerfile for a monorepo application cannot simply `COPY` the specific app's folder. It must be aware of the entire repository structure to correctly build the dependency graph.

- **Correct Approach:** The `Dockerfile` should be at the root of the monorepo. It should copy the root `package.json` and the `package.json` files from all workspaces (`apps/*` and `packages/*`) before running the dependency installation step.

### 2. Multi-Stage Builds

This is the standard for creating small and secure production images. The process is split into two main stages:

- **Builder Stage:**
    1.  Starts from a full-featured base image (e.g., `oven/bun:1.0`).
    2.  Copies the entire monorepo source code and installs *all* dependencies, including `devDependencies`.
    3.  Runs the build command (e.g., `turbo run build --filter=my-app`).

- **Final Stage:**
    1.  Starts from a clean, lightweight base image (e.g., `oven/bun:1.0-slim`).
    2.  Copies *only* the necessary build artifacts from the `builder` stage.
    3.  This leaves out all source code, development dependencies, and build tools, resulting in a minimal and more secure final image.

### 3. Next.js `output: 'standalone'`

This feature is the key to creating a minimal build artifact for a Next.js application.

- **How it works:** When you enable `output: 'standalone'` in `next.config.js`, the build process creates a special folder at `.next/standalone`. This folder contains the Next.js server, its dependencies, and only the necessary `node_modules` to run the application.
- **Benefit for Docker:** In the `Final Stage` of your multi-stage build, you can simply copy the `.next/standalone` directory instead of the full `.next` directory and a large `node_modules` folder.

### 4. Using `docker-compose`

For both local development and production, `docker-compose.yml` is an invaluable tool for orchestration.

- **Purpose:** It allows you to define and manage all the services your application needs (e.g., the Next.js app, a backend API, a database, a cache) in a single configuration file.
- **Benefit:** You can spin up, network, and tear down your entire application stack with a single command (`docker-compose up`), which simplifies development and mimics your production environment.