# NotebookLM Integration Plan (Google Drive Bridge)

This plan details the implementation of a feature allowing users to export selected saved links from SmarTrack directly to their Google Drive as a consolidated document. This document can then be easily imported into NotebookLM as a source.

## Overview

**Goal**: Allow users to select links -> Click "Export to NotebookLM" -> Create a Google Doc in their Drive with the content.

**Architecture**:
1.  **Frontend**: Handles user selection and initiates the Google OAuth flow to get an `access_token` with `drive.file` scope.
2.  **Backend**: Receives the `access_token` and the list of Link IDs. Fetches link content, formats it, and uploads it to Google Drive using the provided token.

## Phase 1: Google Cloud Configuration (Prerequisite)

To interact with Google Drive, we need a Google Cloud Project.

1.  **Create Project**: Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  **Enable API**: Enable "Google Drive API".
3.  **OAuth Consent Screen**: Configure the consent screen (User Type: External).
4.  **Credentials**: Create "OAuth 2.0 Client IDs" for a Web Application.
    *   **Authorized JavaScript origins**: `http://localhost:5173` (and your production URL).
    *   **Authorized redirect URIs**: `http://localhost:5173` (or where your app handles the callback).
5.  **Client ID**: We will need the `CLIENT_ID` for the frontend.

## Phase 2: Backend Implementation

### 1. Dependencies
Add the following to `requirements.txt`:
*   `google-api-python-client`
*   `google-auth`
*   `google-auth-httplib2`

### 2. New Service: `services/google_drive.py`
Create a service to handle the Drive API interactions.
*   Function `create_export_doc(access_token, title, content)`:
    *   Authenticates using the user-provided `access_token`.
    *   Creates a new Google Doc (MIME: `application/vnd.google-apps.document`) or Text file.
    *   Uploads the compiled content.

### 3. API Endpoint: `/api/integrations/notebooklm/export`
*   **Method**: POST
*   **Body**:
    ```json
    {
      "link_ids": ["..."],
      "google_access_token": "..."
    }
    ```
*   **Logic**:
    1.  Validate user session (SmarTrack auth).
    2.  Fetch `Link` objects for the given IDs.
    3.  Compile content:
        *   Title
        *   URL
        *   Summary/Description
        *   (Optional) Scraped content if available.
    4.  Call `services.google_drive.create_export_doc`.
    5.  Return the `fileId` and `webViewLink` of the created doc.

## Phase 3: Frontend Implementation

### 1. Dependencies
*   Install `@react-oauth/google`: `npm install @react-oauth/google`

### 2. Auth Provider
*   Wrap the application (or the relevant part) in `GoogleOAuthProvider` with the `CLIENT_ID`.

### 3. UI Components
*   **Export Button**: Add a button "Export to NotebookLM" in the Dashboard toolbar (visible when items are selected).
*   **OAuth Flow**:
    *   When clicked, trigger the Google Login flow requesting scope: `https://www.googleapis.com/auth/drive.file`.
    *   **Note**: `drive.file` is recommended as it only gives access to files created by this app, not the user's whole Drive.

### 4. Integration Logic
*   On successful Google login, get the `access_token`.
*   Call the SmarTrack backend `/api/integrations/notebooklm/export` with the token and link IDs.
*   Show a success message with a link to open the file in Drive (optional).

## Phase 4: Content Formatting

To get the best results in NotebookLM, the exported document should be structured clearly:

```text
# SmarTrack Export - [Date]

## Link 1: [Title]
URL: [URL]
Tags: [Tags]

[Summary/Description]

---

## Link 2: [Title]
...
```

## Security Considerations
*   **Token Handling**: The backend should not store the Google `access_token` persistently if it's just for a one-off export. We use it once and discard it.
*   **Scopes**: Strictly use `https://www.googleapis.com/auth/drive.file` to minimize permissions.

## Next Steps
1.  User provides Google Cloud `CLIENT_ID`.
2.  Install backend dependencies.
3.  Implement backend endpoint.
4.  Implement frontend button and auth.

