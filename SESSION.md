# Session Notes

## Issues & Oddities Deferred

1. **`apps/wserver` ESLint Flat Config Migration**:
   - `apps/wserver` is upgraded to ESLint 9 (`eslint@^9.39.3`) but lacks an `eslint.config.mjs` / `eslint.config.js` file, causing `pnpm --filter @botify/wserver lint` to fail with missing flat config error. Needs either an `eslint.config.mjs` configuration or a legacy compatibility flag.
