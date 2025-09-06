
# Summary: Next.js Official Docker Documentation

This document summarizes the key points from the official Next.js documentation regarding Docker deployment, with a specific focus on the `output: 'standalone'` feature.

**Source:** [https://nextjs.org/docs/pages/building-your-application/deploying/docker](https://nextjs.org/docs/pages/building-your-application/deploying/docker)

---

## The `output: 'standalone'` Feature

The primary recommendation for containerizing a Next.js application is to use the `standalone` output mode. This feature is designed to create a minimal, production-only build artifact.

When enabled, the build process (`next build`) will generate a new folder at `.next/standalone`. This folder contains a self-contained version of the application, including:

- A minimal `server.js` file to run the application.
- All necessary `.next/server` and `.next/static` assets.
- A minimal `node_modules` directory containing only the exact packages required to run in production.

## Key Benefits for Docker Deployments

1.  **Drastically Reduced Image Size:** This is the most significant advantage. By bundling only the essential files, it avoids copying the entire `node_modules` directory (which can be hundreds of megabytes) into the final image. This commonly results in image size reductions of over 90%.

2.  **Faster Deployments:** Smaller Docker images are pushed and pulled from container registries much faster, leading to quicker CI/CD pipeline execution and faster deployment cycles.

3.  **Improved Security:** A minimal image has a smaller attack surface because it contains fewer files and packages, reducing the number of potential vulnerabilities.

## How to Implement Standalone Output

The process involves two main steps:

### Step 1: Enable Standalone Mode in `next.config.js`

Modify your `next.config.js` file to include the `output` property:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
```

### Step 2: Use a Multi-Stage Dockerfile

A multi-stage build is critical to leveraging the standalone output effectively.

-   **Builder Stage:**
    -   This stage has the full source code and all dependencies (including `devDependencies`).
    -   It runs `npm install` (or equivalent) and `next build` to generate the `.next/standalone` directory.

-   **Runner Stage:**
    -   This stage starts from a lightweight, clean base image (e.g., `node:20-alpine`).
    -   It copies **only** the `.next/standalone` directory from the `Builder` stage.
    -   It may also need to copy the `public` and `.next/static` folders if assets are not served from a CDN.

### Step 3: Running the Container

Since the standalone output generates its own `server.js`, you do not use the `next start` command. The `CMD` instruction in your Dockerfile should be:

```dockerfile
CMD ["node", "server.js"]
```
