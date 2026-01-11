# 🚀 Publishing SmarTrack to Chrome Web Store

I have prepared your extension for publication!

## 📦 Package Ready
I created a zip file in your project root:
**`smartrack-extension-v1.0.0.zip`**

This file contains everything needed for the store upload.

## 📝 Step-by-Step Guide

### 1. Developer Account
If you haven't already:
1.  Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2.  Sign in with your Google account.
3.  Register as a developer (requires a one-time $5 fee).

### 2. Upload the Extension
1.  Click **"Add new item"** in the dashboard.
2.  Upload the `smartrack-extension-v1.0.0.zip` file.

### 3. Fill Out Listing
You will need to fill in the Store Listing details. I've prepared all the text for you in:
`extension/CHROME_STORE_LISTING.md`

Copy-paste the **Description** and **Short Description** from there.

### 4. Privacy & Permissions
The Store will ask about permissions. Here is what to answer:

*   **Host Permissions (`*://*/*`)**:
    *   *Justification*: "The extension allows users to save bookmarks from any website they visit. It needs access to the current page to extract the title, URL, and selected text description."
*   **ActiveTab**:
    *   *Justification*: "Used to capture the current tab's details when the user clicks the extension icon."
*   **Storage**:
    *   *Justification*: "Used to store the user's authentication token and settings locally."
*   **Scripting**:
    *   *Justification*: "Used to inject content scripts that can read the page selection for the 'Save Link' functionality."

### 5. Screenshots
You need to take at least 1 screenshot (1280x800 or 640x400 preferred).
1.  Open your extension locally.
2.  Take a screenshot of the popup window.
3.  Take a screenshot of the Dashboard (web app).
4.  Upload these to the "Store Listing" tab.

### 6. Submit
Once all sections (Store Listing, Privacy, Pricing) are green checkmarks, click **"Submit for Review"**.
Review typically takes 24-48 hours.

---

**Note:** Ensure your backend (`https://smartrack-back.onrender.com`) is running and stable, as the review team will test the functionality!

