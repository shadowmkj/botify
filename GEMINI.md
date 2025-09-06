# Gemini Project Context: Botify

This document provides context for the Botify project, a WhatsApp automation tool.

Refer to botify_overview.md for a detailed overview of the project architecture, key technologies, and development workflow.

## Project Overview

This is a monorepo for a WhatsApp automation tool called Botify. It's built with Next.js, Tailwind CSS, and ShadCN for the frontend, and a backend powered by Node.js, Express, and Baileys (a WhatsApp Web API library). The project uses Prisma as an ORM for a PostgreSQL database and Redis for message queuing with BullMQ.

### Key Technologies

*   **Frontend:** Next.js, React, Tailwind CSS, ShadCN
*   **Backend:** Node.js, Express, Baileys (for WhatsApp interaction), Socket.io
*   **Database:** PostgreSQL with Prisma
*   **Message Queue:** Redis with BullMQ
*   **Authentication:** BetterAuth (Credentials & Google Login)
*   **Monorepo:** Turborepo

### Workspaces

*   `apps/web`: The Next.js frontend application.
*   `apps/socket`: A WebSocket server for real-time communication.
*   `apps/wserver`: The main backend server for WhatsApp automation.
*   `packages/db`: Contains the Prisma schema and database client.
*   `packages/redis`: Redis client configuration.
*   `packages/types`: Shared TypeScript types and schemas.

## Building and Running

1.  **Install Dependencies:**
    ```bash
    bun install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env` file in the root directory and add the following:
    ```
    BETTER_AUTH_SECRET=<your_better_auth_secret>
    BETTER_AUTH_URL=http://localhost:3000
    DATABASE_URL="postgresql://<username>:<password>@<host>/<database_name>?sslmode=require"
    GOOGLE_CLIENT_ID=<your_google_client_id>
    GOOGLE_CLIENT_SECRET=<your_google_client_secret>
    ```

3.  **Run Database Migrations:**
    ```bash
    bunx prisma migrate dev
    ```

4.  **Start the Development Servers:**
    ```bash
    bun dev
    ```

## Development Conventions

*   **Package Manager:** Bun is used as the package manager.
*   **Database:** Database schema changes are managed with Prisma migrations.
*   **Linting:** ESLint is used for linting. Run `bun lint` to check for issues.
*   **Types:** Shared types are located in the `packages/types` workspace.

## [!IMPORTANT]
1. Always use ShadCN components for UI consistency.
2. Always make sure the commit messages is clear and concise.
3. Do not ask to run bun dev after implementing a solution. I will run it manually  
