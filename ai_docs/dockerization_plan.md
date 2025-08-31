# Dockerizing the Botify Application

This document outlines the plan to dockerize the Botify application using Docker and Docker Compose. This setup is intended for a development environment, enabling hot-reloading for the application code.

## Step 1: Create a `Dockerfile`

A multi-stage `Dockerfile` will be created in the root of the project to build a development image for the application.

### Dockerfile Stages

1.  **Base Stage:**
    *   Start from the official `oven/bun:1` base image.
    *   Install the `turborepo-cli` globally using `bun add -g turbo`.
    *   Set the working directory to `/app`.

2.  **Dependencies Stage:**
    *   Copy the root `package.json`, `bun.lock`, and `turbo.json`.
    *   Copy all workspace `package.json` files to their respective directories.
    *   Install all dependencies using `bun install --frozen-lockfile`.

3.  **Runner Stage:**
    *   Copy the entire source code.
    *   Copy the `node_modules` from the dependencies stage.
    *   The `CMD` will be `turbo run dev` to start all services in development mode.

## Step 2: Create a `compose.yaml`

A `compose.yaml` file will be created in the root of the project to define and manage the multi-container application.

### Services

1.  **`postgres`:**
    *   Uses the `postgres:15-alpine` image.
    *   Configured with environment variables for the database user, password, and name from a `.env` file.
    *   A named volume `postgres_data` will be used for data persistence.
    *   Maps port `5432` to the host.

2.  **`redis`:**
    *   Uses the `redis:7-alpine` image.
    *   A named volume `redis_data` will be used for data persistence.
    *   Maps port `6379` to the host.

3.  **`app`:**
    *   Builds the image from the `Dockerfile` in the current directory.
    *   Depends on the `postgres` and `redis` services to ensure they start first.
    *   Maps port `3000` (for the web app) and `3001` (for the socket server) to the host.
    *   Uses the `.env` file for environment variables.
    *   Mounts the entire project directory as a volume to `/app` to enable hot-reloading.

## Step 3: Instructions for Building and Running

The following commands will be used to manage the application with Docker Compose:

*   **Build the images:** `docker-compose build`
*   **Start the services:** `docker-compose up -d`
*   **Stop the services:** `docker-compose down`
*   **View logs:** `docker-compose logs -f`

This plan will result in a fully containerized development environment for the Botify application.
