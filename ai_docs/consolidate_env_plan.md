# Consolidating Environment Variables in Botify Monorepo

## Problem Statement

The project currently uses multiple `.env` files across different applications and packages (e.g., `apps/web/.env`, `apps/wserver/.env`, `packages/types/.env`, etc.). The goal is to consolidate all environment variables into a single, global `.env` file located at the monorepo root (`/Users/milan/Desktop/Apps/better-auth/.env`) and ensure all applications and packages correctly utilize this central file.

## Analysis

1.  **`apps/wserver` (Node.js/Express/Baileys):**
    *   Initially lacked `dotenv` as a dependency.
    *   Requires `dotenv` to load environment variables from a specified path.

2.  **`apps/socket` (Node.js/Socket.io):**
    *   Already has `dotenv` as a dependency.
    *   Requires configuration to load environment variables from the monorepo root.

3.  **`apps/web` (Next.js Frontend):**
    *   Next.js has built-in support for `.env` files and typically looks for them in the project root and the monorepo root. It should automatically pick up variables from the central `.env` file without specific code changes within `next.config.ts` or application code, as long as the `.env` file is at the monorepo root.

4.  **`packages/db` (Prisma) & `packages/redis` (Redis Client):**
    *   These packages primarily rely on environment variables being present in the process environment where they are executed. By configuring the applications that use these packages (e.g., `wserver`, `socket`, `web`) to load the root `.env`, these packages will implicitly have access to the necessary variables.

## Solution Steps

To achieve a single global `.env` file, follow these steps:

### Step 1: Add `dotenv` to `apps/wserver` (Completed)

`dotenv` was added as a dependency to the `apps/wserver` package.

```bash
bun add dotenv --filter=wserver
```

### Step 2: Modify `start` and `dev` scripts to load root `.env`

Update the `package.json` scripts for `apps/wserver` and `apps/socket` to explicitly load the root `.env` file. This ensures that when these applications are started, they correctly access the centralized environment variables.

**For `apps/wserver/package.json`:**

Replace the existing `start` and `dev` scripts with the following:

```json
"scripts": {
  "start": "DOTENV_CONFIG_PATH=./.env node -r dotenv/config dist/worker.js",
  "dev": "DOTENV_CONFIG_PATH=../../.env ts-node-dev --respawn --transpile-only src/worker.ts",
  // ... other scripts
}
```

**For `apps/socket/package.json`:**

Replace the existing `start` and `dev` scripts with the following:

```json
"scripts": {
  "start": "DOTENV_CONFIG_PATH=./.env node -r dotenv/config dist/server.js",
  "dev": "DOTENV_CONFIG_PATH=../.env ts-node-dev --respawn --transpile-only server.ts",
  // ... other scripts
}
```

*   **Explanation of `DOTENV_CONFIG_PATH`:**
    *   When running from the monorepo root (e.g., `bun run start --filter=wserver`), `DOTENV_CONFIG_PATH=./.env` points to the `.env` file in the monorepo root.
    *   When running `dev` scripts directly from within the app directory (e.g., `cd apps/wserver && bun dev`), `DOTENV_CONFIG_PATH=../../.env` correctly points two directories up to the monorepo root.

### Step 3: User Action - Consolidate `.env` files

1.  **Create a single `.env` file at the monorepo root:**
    *   Move all environment variables from existing `.env` files (e.g., `apps/web/.env`, `apps/wserver/.env`, `packages/types/.env`, etc.) into a single file: `/Users/milan/Desktop/Apps/better-auth/.env`.

2.  **Delete individual `.env` files:**
    *   Once all variables are consolidated, delete the individual `.env` files from their respective app and package directories.

### Step 4: Verification

After completing the above steps:

1.  Run your applications (e.g., `bun dev` from the monorepo root, or `bun start --filter=wserver`).
2.  Verify that all environment variables are correctly loaded and accessible within each application. You can add temporary `console.log(process.env.YOUR_VAR)` statements to confirm.

This approach centralizes your environment configuration, making it easier to manage and ensuring consistency across your monorepo.
