# NotebookLM Integration Setup Guide

## Overview

This integration allows users to export selected links to Google Drive for use in NotebookLM.
It supports two modes:
1.  **Integrated Mode (Preferred)**: Uses the user's Google connection from Auth0 if configured.
2.  **Standalone Mode**: Asks the user to grant permission via a popup if the integrated connection is missing or insufficient.

## Backend Configuration (Required for Integrated Mode)

To enable the backend to fetch Google tokens automatically from Auth0, you must configure Machine-to-Machine (M2M) access for the backend to the Auth0 Management API.

1.  **Get Auth0 Credentials**:
    *   Go to **Auth0 Dashboard > Applications > [Your Backend App]**.
    *   Copy **Client ID** and **Client Secret**.
    *   Go to **APIs > Auth0 Management API > Machine to Machine Applications**.
    *   Authorize your Backend App.
    *   Grant the following scopes: `read:users`, `read:user_idp_tokens`.

2.  **Update `.env`**:
    Add these variables to your backend `.env` file:
    ```env
    AUTH0_CLIENT_ID=your_auth0_client_id
    AUTH0_CLIENT_SECRET=your_auth0_client_secret
    ```

## Frontend Configuration

1.  **Google Cloud Project**:
    *   Create a Google Cloud Project.
    *   Enable **Google Drive API**.
    *   Configure OAuth Consent Screen (Scopes: `.../auth/drive.file`).
    *   Create OAuth Client ID (Web Application).
    *   Add `http://localhost:5173` to Authorized Origins/Redirects.

2.  **Update `.env`**:
    ```env
    VITE_GOOGLE_CLIENT_ID=your_google_cloud_client_id
    ```

## User Experience

1.  **First Login**: When users log in via "Continue with Google", Auth0 will request access to `drive.file` (thanks to `connection_scope` in `main.tsx`).
2.  **Exporting**: When the user clicks "Export":
    *   **Step 1**: The app asks the backend to export.
    *   **Step 2**: The backend checks if it can get a Google Token from Auth0 for this user.
    *   **Step 3**: If successful, export happens instantly.
    *   **Step 4**: If not (e.g. user didn't grant permission or not logged in with Google), the frontend prompts the user to sign in with Google again (Standalone Mode).
