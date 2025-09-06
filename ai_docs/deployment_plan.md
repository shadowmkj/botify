# Deployment Plan

This document outlines the steps to deploy the Botify application to a remote server.

## Steps

1.  **Checkout Code**: The first step is to checkout the code from the repository.
2.  **Setup Node.js**: The environment needs to be set up with the correct Node.js version.
3.  **Install Bun**: Bun is used as the package manager and runtime. It needs to be installed in the CI environment.
4.  **Install Dependencies**: All the project dependencies are installed using `bun install`.
5.  **Build Application**: The entire application is built using the `bun run build` command.
6.  **Prune `node_modules`**: After the build, all `node_modules` folders are removed, except for the one located in the `apps/web` directory. This is to reduce the size of the deployment package.
7.  **Deploy with `rsync`**: The entire application is deployed to the remote server using `rsync`. The `.git` folder is excluded from the deployment.
