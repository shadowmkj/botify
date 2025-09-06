# Revised Deployment Plan (Single-Image Strategy)

This guide outlines a CI/CD workflow to build a single Docker image for the entire Botify application and deploy it to your server.

---

### **Part 1: CI/CD Pipeline Setup (One-Time Setup)**

1.  **Create GitHub PAT & Secret:** Follow the previous instructions to create a Personal Access Token (PAT) with `write:packages` scope and save it as a repository secret named `CR_PAT`. This step is the same.

2.  **Define `compose.yaml` for Production:** Your `compose.yaml` file on the server should be structured to run a single application service, along with your database and Redis. It should look like this. **Note:** We will create the `build-and-push.yml` file in the next step which will create the `ghcr.io/YOUR_GITHUB_USERNAME/botify-app:latest` image.

    ```yaml
    services:
      postgres:
        image: postgres:15-alpine
        restart: always
        environment:
          - POSTGRES_USER=${POSTGRES_USER}
          - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
          - POSTGRES_DB=${POSTGRES_DB}
        ports:
          - '5432:5432'
        volumes:
          - postgres_data:/var/lib/postgresql/data

      redis:
        image: redis:7-alpine
        restart: always
        ports:
          - '6379:6379'
        volumes:
          - redis_data:/data

      app:
        image: ghcr.io/YOUR_GITHUB_USERNAME/botify-app:latest # The single image for the entire app
        restart: always
        depends_on:
          - postgres
          - redis
        ports:
          - '3000:3000'
          - '3001:3001'
          - '3002:3002' # Exposing all necessary ports
        env_file:
          - .env

    volumes:
      postgres_data:
      redis_data:
    ```

3.  **Create the GitHub Actions Workflow:** Create a file at `.github/workflows/build-and-push.yml` with the following content. This workflow uses your existing `Dockerfile.prod` to build the single application image.

    ```yaml
    name: Build and Push Single Docker Image

    on:
      push:
        branches:
          - main

    jobs:
      build-and-push:
        runs-on: ubuntu-latest
        permissions:
          contents: read
          packages: write

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Log in to GitHub Container Registry
            uses: docker/login-action@v3
            with:
              registry: ghcr.io
              username: ${{ github.repository_owner }}
              password: ${{ secrets.CR_PAT }}

          - name: Build and push application image
            uses: docker/build-push-action@v5
            with:
              context: .
              dockerfile: Dockerfile.prod # Using the production dockerfile in the root
              push: true
              tags: ghcr.io/${{ github.repository_owner }}/botify-app:latest
    ```

---

### **Part 2: Server Deployment & Maintenance**

The server workflow remains simple.

1.  **Initial Setup:** Clone the repo, create your `.env` file, and `docker login` to GHCR on your server.
2.  **Deploy/Update:** When you want to deploy a new version:
    ```bash
    cd /path/to/better-auth

    # Get the latest compose file
    git pull

    # Pull the new all-in-one image
    docker compose pull app

    # Restart the service
    docker compose up -d

    # Run migrations if needed
    # docker compose exec app bunx prisma migrate deploy
    ```
