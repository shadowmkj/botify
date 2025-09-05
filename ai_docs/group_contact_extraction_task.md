
# Task: Group Contact Extraction

This document outlines the plan to implement a feature that allows users to extract contact information from their WhatsApp groups.

## 1. Frontend (apps/web)

### 1.1. New Route and Page

- Create a new route `/group-extraction`.
- Create a new page component at `apps/web/app/(admin)/group-extraction/page.tsx`.
- This page will contain the UI for fetching groups and creating contact groups.

### 1.2. UI Components

- **Fetch Groups Button:**
  - Add a new button to the UI, labeled "Fetch Groups".
  - This button will be placed in a relevant location, such as the user's device management page.
  - Clicking this button will trigger a request to the backend to fetch all groups the user's device is a part of.

- **Groups List Display:**
  - Create a modal or a dedicated section to display the list of fetched groups.
  - Each group in the list should be clearly identifiable, displaying the group's name.

- **Group Selection:**
  - Implement a mechanism to select a group from the list (e.g., radio buttons, dropdown).

- **Create Contact Group Button:**
  - Add a button, labeled "Create Contact Group from Participants".
  - This button will be enabled only when a group is selected.
  - Clicking this button will send a request to the backend to create a new contact group containing all participants from the selected WhatsApp group.

### 1.2. State Management

- Use a state management solution (like Zustand or React Context) to manage the list of groups, the selected group, and the loading state.

### 1.3. API Interaction

- Implement API client functions to communicate with the new backend endpoints for fetching groups and creating contact groups.

## 2. Backend (Next.js API Routes)

### 2.1. API Endpoints

- **`GET /api/groups`:**
  - This endpoint will handle the request to fetch all participating groups for a given device.
  - It will use the `sock.groupFetchAllParticipating()` method from the Baileys library.
  - The response will be a JSON array of group objects, each containing the group's ID and name.

- **`POST /api/contact-groups`:**
  - This endpoint will handle the creation of a new contact group from the participants of a selected group.
  - The request body will contain the group ID.
  - The backend will:
    1. Fetch the participants of the specified group.
    2. Create a new contact group in the database.
    3. Add each participant as a contact to the newly created group.

### 2.2. Baileys Integration

- Integrate the `sock.groupFetchAllParticipating()` method into the `wserver` to retrieve group information from the connected WhatsApp device.

## 3. Real-time Communication (apps/socket)

### 3.1. Socket Events

- **`groups:fetched`:**
  - After the backend successfully fetches the groups, it will emit a `groups:fetched` event to the frontend via the Socket.io server.
  - The event payload will contain the list of groups.

- **`contact-group:created`:**
  - Upon successful creation of a contact group, the backend will emit a `contact-group:created` event.
  - This can be used to provide real-time feedback to the user.

## 4. Step-by-Step Implementation Plan

1. **Backend (wserver):**
   - Create the `GET /api/groups` endpoint.
   - Implement the logic to call `sock.groupFetchAllParticipating()` and return the group data.
   - Create the `POST /api/contact-groups` endpoint.
   - Implement the logic to create a contact group and add participants.

2. **Frontend (web):**
   - Add the "Fetch Groups" button to the UI.
   - Implement the modal or section to display the groups.
   - Set up the group selection mechanism.
   - Add the "Create Contact Group from Participants" button.
   - Implement the API client functions to interact with the new backend endpoints.
   - Use Socket.io to listen for the `groups:fetched` event and update the UI in real-time.

3. **Testing:**
   - Thoroughly test the entire workflow, from fetching groups to creating contact groups.
   - Ensure error handling is in place for cases like API failures or invalid group selections.
