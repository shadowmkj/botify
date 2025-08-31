# Testing Setup Plan for Botify Turborepo

This document outlines the steps to set up a testing environment for the Botify project. We will use Jest as the testing framework.

## 1. Root Level Setup

- **Install Dependencies:** Install `jest`, `@types/jest`, and `ts-jest` at the root of the monorepo.
- **Create Root Jest Configuration:** Create a `jest.config.js` file in the root to configure Jest for the monorepo. This file will define the projects to be tested.
- **Update `package.json`:** Add a `test` script to the root `package.json` to run all tests.
- **Update `turbo.json`:** Add a `test` task to `turbo.json`.

## 2. `apps/web` Setup (Next.js Frontend)

- **Install Dependencies:** Install `jest`, `@types/jest`, `ts-jest`, `@testing-library/react`, and `@testing-library/jest-dom` in the `apps/web` workspace.
- **Create Jest Configuration:** Create a `jest.config.js` file in `apps/web` to configure Jest for the Next.js application.
- **Create Jest Setup File:** Create a `jest.setup.js` file in `apps/web` to import `@testing-library/jest-dom`.
- **Update `package.json`:** Add a `test` script to `apps/web/package.json`.
- **Create an Example Test:** Create a sample test file for an action to demonstrate how to write tests.

## 3. `apps/socket` Setup (WebSocket Server)

- **Install Dependencies:** Install `jest`, `@types/jest`, and `ts-jest` in the `apps/socket` workspace.
- **Create Jest Configuration:** Create a `jest.config.js` file in `apps/socket`.
- **Update `package.json`:** Add a `test` script to `apps/socket/package.json`.
- **Create an Example Test:** Create a sample test file for the server logic.

## 4. `apps/wserver` Setup (Backend Server)

- **Install Dependencies:** Install `jest`, `@types/jest`, and `ts-jest` in the `apps/wserver` workspace.
- **Create Jest Configuration:** Create a `jest.config.js` file in `apps/wserver`.
- **Update `package.json`:** Add a `test` script to `apps/wserver/package.json`.
- **Create an Example Test:** Create a sample test file for the server logic.

## 5. Execution

- **Run Tests:** Execute the tests from the root of the monorepo to ensure everything is working correctly.
