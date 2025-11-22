# Clean Up Test Data

If you see "mock-user-id" or "test-user" in your Admin Analytics, these are leftover records from development/testing.

I've created a script to clean them up safely.

## How to Run

### 1. Local Environment
```bash
cd backend
python scripts/cleanup_test_users.py
```
Type `y` when prompted to confirm deletion.

### 2. Production (Render)
You cannot run interactive scripts directly on Render console easily.
However, you can trigger it if you deploy it as a job or run it locally connecting to the remote DB (if IP allowed).

Since your `MONGODB_URI` in `backend/core/config.py` points to a remote Atlas cluster (`mongodb+srv://...`), you can run the script **locally** and it will clean up the **remote** database.

**Steps:**
1.  Open your terminal in the `backend` folder.
2.  Ensure you have dependencies installed (`pip install -r requirements.txt`).
3.  Run:
    ```bash
    python scripts/cleanup_test_users.py
    ```
4.  Confirm with `y`.

## What it Deletes
It deletes all **Links** and **Collections** where the `userId`:
- Equals `mock-user-id`
- Starts with `mock-`
- Starts with `test-`

It **DOES NOT** delete real users (e.g. `google-oauth2|...` or emails).

