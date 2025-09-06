
# Guide: Environment Variable Setup

This document provides a detailed guide on how to configure environment variables for both local development and a production deployment on a VPS.

---

## Part 1: Local Development Setup

This setup is for running the entire application stack on your local machine using `docker compose up`. The goal is to perfectly mimic the production container environment.

### Step 1: Create a Local `.env` File

This file will hold the secrets and configuration for your local instance. It is read by the `app` service defined in the original `compose.yaml` (the one with the `build` step).

1.  **Copy the example file:** In the root of the project, run:
    ```bash
    cp .example.env .env
    ```
2.  **Edit the `.env` file:** Open the new `.env` file. You must fill in all variables. The most important ones for Docker networking are `DATABASE_URL` and `REDIS_HOST`.

    ```env
    # .env (for local development)

    # Auth Secrets
    BETTER_AUTH_SECRET="a_strong_secret_for_local_development"
    BETTER_AUTH_URL="http://localhost:3000"
    GOOGLE_CLIENT_ID="your_local_google_client_id"
    GOOGLE_CLIENT_SECRET="your_local_google_client_secret"

    # --- Docker Networking ---
    # Why 'postgres' and 'redis'?
    # Docker Compose creates a private virtual network for your services.
    # Inside this network, each container can be reached by its service name.
    # So, from the 'app' container, the hostname for the database is 'postgres'.
    DATABASE_URL="postgresql://user:password@postgres:5432/botify?sslmode=disable"
    REDIS_HOST=redis
    REDIS_PORT=6379

    # --- App Selection for start.sh ---
    # This tells the container which application to run.
    APP_NAME=web
    ```

### How it Works

When you run `docker compose up` with the original `compose.yaml`, the `app` service loads the `.env` file, allowing your application code (`process.env.DATABASE_URL`) to connect to the other containers using their service names.

---

## Part 2: Production VPS Setup

This setup is for your live server. The key principle is that **production secrets should never be in your Git repository.**

### Step 1: Create a Production `production.env` File on the VPS

After you have SSH'd into your server and cloned the repository, you will create a *new* environment file.

1.  **Navigate to your project directory:**
    ```bash
    cd /path/to/your-repo-name
    ```
2.  **Create the production environment file:**
    ```bash
    nano production.env
    ```
3.  **Add your production configuration:** Paste and edit the following. This file is loaded by the production `compose.yaml` that I have created for you.

    ```env
    # production.env (on your VPS - DO NOT COMMIT)

    # --- Production Secrets ---
    # Use strong, unique secrets for your live application.
    BETTER_AUTH_SECRET="a_very_strong_and_unique_production_secret"
    BETTER_AUTH_URL="http://your_domain.com" # Or your VPS IP address
    GOOGLE_CLIENT_ID="your_production_google_client_id"
    GOOGLE_CLIENT_SECRET="your_production_google_client_secret"

    # --- Docker Networking (for Production Compose) ---
    # These still use service names because the containers are still
    # communicating within the Docker network on your VPS.
    DATABASE_URL="postgresql://user:password@postgres:5432/botify?sslmode=disable"
    REDIS_HOST=redis
    REDIS_PORT=6379

    # --- Variables for the Postgres Container ---
    # The compose.yaml file passes these to the postgres service.
    POSTGRES_USER=user
    POSTGRES_PASSWORD=password
    POSTGRES_DB=botify

    # --- App Selection for start.sh ---
    # This tells the container which application to run.
    # You can change this to "wserver" or "socket" if you are
    # deploying a different service to this VPS.
    APP_NAME=web
    ```
    Save and exit the editor (Ctrl+X, then Y, then Enter).

### Step 2: GitHub Secrets for the CI/CD Pipeline
