# Revised Deployment Plan: CI/CD with GitHub Actions

This revised guide outlines a modern CI/CD workflow for deploying the Botify application. We will use GitHub Actions to build and push Docker images to the GitHub Container Registry (GHCR). The production server will only be responsible for pulling these pre-built images and running them.

**This plan assumes your server is already configured with Docker and Docker Compose.**

---

## Part 1: CI/CD Pipeline Setup (One-Time Setup)

This section covers the initial setup of the continuous integration pipeline.

### Step 1.1: Create a GitHub Personal Access Token (PAT)

The GitHub Actions workflow needs permission to push Docker images to your account's container registry.

1.  Go to **GitHub Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
2.  Click **Generate new token**.
3.  Give it a descriptive name (e.g., `GHCR_PUSH`).
4.  Set the expiration as needed.
5.  Select the following scopes:
    *   `write:packages` (to publish images)
    *   `read:packages` (to read images)
6.  Click **Generate token** and copy the token immediately. You will not be able to see it again.

### Step 1.2: Add the PAT to GitHub Secrets

Store the PAT securely as a secret in your repository.

1.  In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**.
2.  Click **New repository secret**.
3.  Name the secret `CR_PAT`.
4.  Paste the PAT you copied in the "Value" field.
5.  Click **Add secret**.

### Step 1.3: Update `compose.yaml` for GHCR

Modify your `compose.yaml` file to point to the GHCR images that the workflow will create. Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

**Example:**
```yaml
services:
  web:
    # The image name must be lowercase
    image: ghcr.io/YOUR_GITHUB_USERNAME/botify-web:latest
    # ... rest of the service config
  wserver:
    image: ghcr.io/YOUR_GITHUB_USERNAME/botify-wserver:latest
    # ... rest of the service config
  socket:
    image: ghcr.io/YOUR_GITHUB_USERNAME/botify-socket:latest
    # ... rest of the service config
  # ... other services like db, redis
```
**Commit and push this change to your repository.**

### Step 1.4: Create the GitHub Actions Workflow

Create a new workflow file that will build and push your images.

1.  Create the directory `.github/workflows` if it doesn't exist.
2.  Create a new file named `build-and-push.yml` inside it.
3.  Paste the following content into the file:

```yaml
name: Build and Push Docker Images

on:
  push:
    branches:
      - main # Or your primary branch

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

      - name: Build and push web image
        uses: docker/build-push-action@v5
        with:
          context: .
          dockerfile: apps/web/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/botify-web:latest

      - name: Build and push wserver image
        uses: docker/build-push-action@v5
        with:
          context: .
          dockerfile: apps/wserver/src/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/botify-wserver:latest

      - name: Build and push socket image
        uses: docker/build-push-action@v5
        with:
          context: .
          dockerfile: apps/socket/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/botify-socket:latest
```
4.  **Commit and push this new workflow file.** This will trigger the first build. You can monitor its progress in the "Actions" tab of your repository.

---

## Part 2: Server Deployment Workflow

Follow these steps on your production VPS.

### Step 2.1: Initial Server Setup

This only needs to be done once.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/YOUR_GITHUB_USERNAME/better-auth.git
    cd better-auth
    ```
2.  **Configure Environment Variables:** Create the `.env` file and add your production secrets.
    ```bash
    cp .example.env .env
    nano .env
    ```
    *Ensure `DATABASE_URL` points to the Docker service name (e.g., `db`) and `BETTER_AUTH_URL` points to your public domain.*

3.  **Authenticate with GHCR:** Log your server's Docker daemon into GHCR. You can use the same PAT from Step 1.1. For security, load it from a file or environment variable rather than typing it directly in the command line.
    ```bash
    # Make sure CR_PAT is set as an environment variable
    echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
    ```

### Step 2.2: Deploy the Application

1.  **Pull the Latest Images:** Fetch the images that were built by your GitHub Actions workflow.
    ```bash
    docker compose pull
    ```
2.  **Start the Services:** Start all services using the pre-built images.
    ```bash
    docker compose up -d
    ```
3.  **Run Database Migrations:** Apply any pending database migrations.
    ```bash
    docker compose exec wserver bunx prisma migrate deploy
    ```

Your application is now live. The optional Nginx reverse proxy setup from the previous plan is still highly recommended.

---

## Part 3: Maintenance & Updates

The new deployment process is much simpler.

1.  **Push Code:** Commit and push your changes to the `main` branch.
2.  **Wait:** Wait for the `Build and Push Docker Images` action to complete successfully in GitHub.
3.  **Deploy on Server:** SSH into your server and run the following commands:
    ```bash
    cd /path/to/your/project/better-auth

    # Get latest compose file if it changed
    git pull

    # Pull the new images built by the CI/CD pipeline
    docker compose pull

    # Restart the services with the new images
    docker compose up -d

    # Run migrations if your update included database changes
    # docker compose exec wserver bunx prisma migrate deploy
    ```