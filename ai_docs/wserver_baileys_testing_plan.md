# Task: Implement Robust Tests for `wserver` Baileys Integration

**Objective:** To create a reliable and effective testing suite for the `wserver` message sending logic, focusing on a robust mocking strategy for the Baileys WhatsApp API. This plan addresses the configuration issues encountered previously and outlines a clear path to verifying the application's behavior without making live API calls.

**Core Challenge:** The Baileys library is designed for live interaction with the WhatsApp Web API, and there is no official testing framework. Therefore, our strategy must rely on creating a high-fidelity mock of the Baileys socket (`sock`) object to simulate its behavior accurately.

---

## Step-by-Step Implementation Plan

### Step 1: Clean Up Previous Test Artifacts

*   **Purpose:** To start with a clean slate and avoid conflicts with the previous, non-functional test setup.
*   **Action:**
    1.  Delete the existing test file: `apps/wserver/src/__tests__/worker.test.ts`.
    2.  Delete the existing Jest configuration: `apps/wserver/jest.config.js`.
*   **Tooling:** `run_shell_command` (`rm ...`).

### Step 2: Re-initialize Jest Configuration

*   **Purpose:** To create a correct and functional Jest configuration from scratch.
*   **Action:**
    1.  Create a new `jest.config.js` file in `apps/wserver`.
    2.  This configuration will be minimal but correct, with a focus on properly mapping the monorepo's internal packages (`@repo/db`, `@repo/types`, etc.) to their source files to avoid module resolution errors.
*   **Tooling:** `write_file`.

### Step 3: Create a Dedicated Baileys Mock

*   **Purpose:** To create a reusable and detailed mock for the Baileys `sock` object. This is the cornerstone of our testing strategy.
*   **Action:**
    1.  Create a new file at `apps/wserver/src/__tests__/mocks/baileys.mock.ts`.
    2.  In this file, create a mock `sock` object that includes all the properties and methods used by `worker.ts`, such as `onWhatsApp`, `sendMessage`, and any event emitters (`ev`).
    3.  The mock methods (`jest.fn()`) will be exported so they can be imported into test files, allowing for inspection and assertion of calls.
*   **Tooling:** `write_file`.

### Step 4: Re-create the Worker Test File

*   **Purpose:** To create a new, clean test file for `worker.ts`.
*   **Action:**
    1.  Create `apps/wserver/src/__tests__/worker.test.ts`.
    2.  Implement the basic structure for the tests, including `describe` blocks and initial `beforeEach` setup to reset mocks.
    3.  Mock all other external dependencies as before (`prisma`, `bullmq`, `logger`, etc.), but this time, import the dedicated Baileys mock from `baileys.mock.ts`.
*   **Tooling:** `write_file`.

### Step 5: Implement Test Cases (Success and Error Scenarios)

*   **Purpose:** To write the actual tests that verify the worker's logic.
*   **Action:**
    1.  **Success Scenario:** Write a test that simulates a successful `send-message` job.
        *   Arrange: Configure the Baileys mock to return successful responses (e.g., `mockOnWhatsApp.mockResolvedValue(...)`).
        *   Act: Call the worker's processor.
        *   Assert: Verify that `mockSendMessage` was called with the correct parameters and that the database was updated.
    2.  **Error Scenarios:** Write tests for various failure modes.
        *   Session not found.
        *   `onWhatsApp` check fails (number is not on WhatsApp).
        *   `sendMessage` throws an error.
        *   Assert that in each case, the application handles the error gracefully (e.g., logs an error, does not update the database).
*   **Tooling:** `replace` or `write_file`.

### Step 6: Run Tests and Validate

*   **Purpose:** To execute the tests and confirm that the new setup works correctly.
*   **Action:**
    1.  Run the test command: `cd apps/wserver && bun run test`.
    2.  Analyze the output for any errors. The tests should now pass, as the configuration and mocking strategy are more robust.
*   **Tooling:** `run_shell_command`.

### Step 7: Refine and Document

*   **Purpose:** To clean up the code and add comments where necessary to explain the mocking strategy.
*   **Action:**
    1.  Review the test code for clarity and maintainability.
    2.  Add comments to the `baileys.mock.ts` file to explain its purpose and how it simulates the real Baileys object.
*   **Tooling:** `replace`.
