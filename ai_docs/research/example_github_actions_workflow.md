
# Research: Example GitHub Actions Workflow for Turborepo Docker Build

This document provides a concrete example of a GitHub Actions workflow for building a Docker image for a single application within a Turborepo monorepo and pushing it to the GitHub Container Registry (GHCR).

---

## Core Strategy

The workflow leverages `turbo prune` to create an isolated, optimized build context for a single application. It then uses standard Docker actions to log in, build, and push the image to a container registry.

## Example Workflow File: `.github/workflows/docker-publish.yml`

This workflow is designed to run on every push to the `main` branch, building and publishing a Docker image for a specific application (e.g., `web`).

```yaml
name: Docker Build and Push

on:
  push:
    branches:
      - main



jobs:
  build-and-push:
    runs-on: ubuntu-latest
    # Required permissions for pushing to GHCR.
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js and Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      

      - name: Install dependencies
        run: bun install --frozen-lockfile

      # The key step for isolating the app for Docker.
      - name: Prune monorepo for Docker image
        run: bun turbo prune --scope=${{ env.APP_NAME }} --docker

      - name: Log in to the GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # This action creates useful tags (e.g., based on commit SHA) for the image.
      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/iamshadow666/${{ env.IMAGE_NAME }}

      # This action builds the image using the pruned context and pushes it.
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          # The context is the root, which now contains the `out` dir.
          context: .
          # The Dockerfile is the one from the main repo, not a pruned one.
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          # Enable Docker layer caching within GitHub Actions.
          
```

## How It Works: Step-by-Step

1.  **Trigger:** The workflow runs on a `push` to the `main` branch.
2.  **Setup:** It checks out the code and installs `bun`.
3.  **`turbo prune`:** This is the most critical step. It creates a pruned version of the monorepo in an `out/` directory, containing only the code and dependencies needed for the application specified by `APP_NAME`.
4.  **Docker Login:** It securely logs into GHCR using a temporary `GITHUB_TOKEN` provided by the GitHub Actions runner.
5.  **Metadata Extraction:** The `docker/metadata-action` generates relevant tags and labels for the Docker image (e.g., `latest`, git SHA, etc.), which is a best practice for versioning.
6.  **Build and Push:** The `docker/build-push-action` orchestrates the final build and push.
    -   `context: .`: The build context is the entire repository root, which is necessary so Docker can see the `out` directory created by `turbo prune`.
    -   `file: ./Dockerfile`: It uses the main `Dockerfile` from the repository root. This `Dockerfile` should be written to work with the pruned `out` directory structure.
    -   `push: true`: Pushes the image to GHCR upon a successful build.
