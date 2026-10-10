# Codecov CI & Test Coverage Plan

## Objective
1. Configure Codecov in CI with GitHub Actions and enforce an 85% minimum code coverage threshold for the project and patches to pass.
2. Expand the test suites across packages/apps in the monorepo to achieve >=85% test coverage.

## Phase 1: Codecov Configuration & CI Workflow
- [x] Configure Jest coverage in monorepo packages (`apps/web`, `apps/socket`, `apps/wserver`, root `jest.config.js`).
- [x] Configure `turbo.json` with `test:coverage` task and caching outputs.
- [ ] Create `codecov.yml` with:
  - `target: 85%` for project status.
  - `target: 85%` for patch status.
  - `threshold: 0%` (strictly enforced).
- [ ] Update `.github/workflows/ci.yml`:
  - Run test suites with coverage.
  - Upload coverage reports via `codecov/codecov-action@v5`.
  - Set up triggers for `push` to `main` and `pull_request` to `main`.

## Phase 2: Codebase Test Analysis & Expansion
- [ ] Audit existing test coverage across apps & packages:
  - `apps/web`: actions, hooks, lib utilities.
  - `apps/socket`: socket handlers, connection management.
  - `apps/wserver`: worker logic, controllers, services.
  - `packages/db`, `packages/redis`, `packages/types`.
- [ ] Implement unit & integration tests targeting untested functions, actions, and modules until total project coverage exceeds 85%.
- [ ] Verify coverage reports locally using `pnpm test:coverage`.
