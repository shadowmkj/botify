# Botify Project Overview

This document provides a detailed overview of the Botify project, a WhatsApp automation tool.

## 1. Project Architecture

Botify is a monorepo managed with **Turborepo**. It consists of three main applications and four shared packages.

### 1.1. Applications

- **`apps/web`**: A **Next.js** application that serves as the frontend. It uses **React**, **Tailwind CSS**, and **ShadCN** for the UI. It also includes a server-side component for handling API requests and authentication.
- **`apps/socket`**: A **Socket.io** server for real-time communication between the frontend and the backend.
- **`apps/wserver`**: The main backend server responsible for WhatsApp automation. It uses **Node.js**, **Express**, and the **Baileys** library to interact with WhatsApp.

### 1.2. Packages

- **`packages/db`**: Contains the **Prisma** schema and database client for the **PostgreSQL** database. It also includes scripts for database migrations and seeding.
- **`packages/redis`**: Configures and provides a **Redis** client for the application. It's used for message queuing with **BullMQ**.
- **`packages/types`**: Defines shared **TypeScript** types and schemas used across the entire monorepo.
- **`packages/typescript-config`**: Provides a base **TypeScript** configuration for other packages in the monorepo.

## 2. Key Technologies

- **Monorepo:** **Turborepo**
- **Package Manager:** **Bun**
- **Frontend:**
    - **Framework:** **Next.js** (with React)
    - **UI:** **Tailwind CSS**, **ShadCN**
- **Backend:**
    - **Runtime:** **Node.js**
    - **Framework:** **Express**
    - **WhatsApp API:** **Baileys**
    - **Real-time Communication:** **Socket.io**
- **Database:**
    - **ORM:** **Prisma**
    - **Database:** **PostgreSQL**
- **Message Queue:**
    - **Broker:** **Redis**
    - **Library:** **BullMQ**
- **Authentication:** **BetterAuth** (Credentials & Google Login)
- **Linting:** **ESLint**
- **Testing:** **Jest**

## 3. Development Workflow

### 3.1. Installation

```bash
bun install
```

### 3.2. Environment Variables

A `.env` file is required in the root directory with the following variables:

```
BETTER_AUTH_SECRET=<your_better_auth_secret>
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL="postgresql://<username>:<password>@<host>/<database_name>?sslmode=require"
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
```

### 3.3. Database

Database migrations are managed with Prisma.

- **Run migrations:**
  ```bash
  bunx prisma migrate dev
  ```
- **Reset database:**
  ```bash
  bun --cwd packages/db db:migrate:reset
  ```
- **Seed database:**
  ```bash
  bun --cwd packages/db db:seed
  ```

### 3.4. Running the Application

```bash
bun dev
```

This command starts all the applications in the monorepo.

### 3.5. Linting

```bash
bun lint
```

### 3.6. Testing

```bash
bun test
```

## 4. Important Conventions

- **UI Components:** Always use **ShadCN** components for UI consistency.
- **Commit Messages:** Commit messages should be clear and concise.
- **Development Server:** Do not ask to run `bun dev` after implementing a solution. The user will run it manually.
