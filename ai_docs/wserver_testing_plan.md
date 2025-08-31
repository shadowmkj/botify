# Task: Implement Tests for `wserver` Message Sending Logic

**Objective:** Ensure the core logic for sending messages within the `apps/wserver` application functions correctly, including successful message delivery and proper error handling.

**Assumptions:**
*   We will use Jest as the testing framework.
*   We will focus on unit/integration tests for the `send-message` job processing logic within `worker.ts`, mocking external dependencies like Baileys, Prisma, and Redis/BullMQ.

---

## Step-by-Step Implementation Plan

### Step 1: Explore `apps/wserver` for Message Sending Logic

*   **Purpose:** To identify the main files and functions responsible for initiating and processing message sending.
*   **Action:** This step has been completed. `apps/wserver/src/worker.ts` is the primary file containing the `send-message` job processing logic.
*   **Verification:** `worker.ts` uses `bullmq` for job processing, `Baileys` (via `sock.sendMessage`) for sending WhatsApp messages, and interacts with Prisma for database updates.

### Step 2: Set Up Jest in `apps/wserver`

*   **Purpose:** To ensure Jest is properly configured for TypeScript testing within the `apps/wserver` workspace.
*   **Action:**
    1.  Verify `jest` and `ts-jest` are listed in `devDependencies` in `apps/wserver/package.json`. (Completed: they are present).
    2.  Create a `jest.config.js` file at `apps/wserver/jest.config.js`.
*   **Tooling:** `write_file` will be used to create `jest.config.js`.

### Step 3: Create a Test File for `worker.ts`

*   **Purpose:** To provide a dedicated file for writing tests related to the `worker.ts` functionality.
*   **Action:** Create a new test file at `apps/wserver/src/__tests__/worker.test.ts`.
*   **Tooling:** `write_file` will be used to create the initial test file.

### Step 4: Mock Dependencies for `worker.test.ts`

*   **Purpose:** To isolate the `worker.ts` logic during testing and prevent actual interactions with external systems (database, Redis, WhatsApp API).
*   **Action:** Within `apps/wserver/src/__tests__/worker.test.ts`, implement Jest mocks for:
    *   `@repo/db/prisma`
    *   `./lib/whatsapp` and the `sock` object
    *   `bullmq`
    *   `./utils/redis`
    *   `./utils/logger`
    *   `./utils/common`
    *   `node-cache`
*   **Tooling:** This step involves writing test code within the new test file.

### Step 5: Write Test Cases for `send-message` Job (Success Scenario)

*   **Purpose:** To verify that messages are sent correctly and associated database updates occur as expected.
*   **Action:** Add a test suite to `apps/wserver/src/__tests__/worker.test.ts` that simulates a successful `send-message` job.
    *   Define a mock `WhatsappJob` object.
    *   Set up mocks to return successful responses.
    *   Execute the worker's job processor with the mock job.
    *   Assert that the correct functions (`sock.sendMessage`, `prisma.device.update`, etc.) were called with the expected arguments.
*   **Tooling:** This step involves writing test code.

### Step 6: Write Test Cases for `send-message` Job (Error Scenarios)

*   **Purpose:** To ensure the `worker.ts` handles various error conditions gracefully.
*   **Action:** Add test cases for:
    *   Invalid Sender Number
    *   Session Not Found
    *   `sock.sendMessage` Failure
    *   `sock.onWhatsApp` Failure
*   **Tooling:** This step involves writing test code.

### Step 7: Run Tests

*   **Purpose:** To execute the newly written tests and verify the functionality.
*   **Action:** Run the command `bun test apps/wserver` from the project root.
*   **Tooling:** `run_shell_command`.

### Step 8: Refine and Iterate

*   **Purpose:** To improve test coverage and fix any identified issues.
*   **Action:** Based on test results, refine the test cases or the message sending logic itself.
*   **Tooling:** `read_file`, `replace`, `write_file`, `run_shell_command`.
