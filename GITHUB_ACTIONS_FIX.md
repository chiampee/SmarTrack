# GitHub Actions Build Fix

## Issue
GitHub Actions workflows were failing with error:
```
Error: Dependencies lock file is not found in /home/runner/work/SmarTrack/SmarTrack. 
Supported file patterns: pnpm-lock.yaml
```

## Root Cause
Some workflow files were configured to use `pnpm` (a different package manager) while the project actually uses `npm` with `package-lock.json`.

## Files Fixed
1. `.github/workflows/pages.yml` - Changed from pnpm to npm
2. `.github/workflows/release.yml` - Changed from pnpm to npm

## Changes Made

### Before (pages.yml)
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build
  run: pnpm run build
```

### After (pages.yml)
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm

- name: Install dependencies
  run: npm ci

- name: Build
  run: npm run build
```

## Status
✅ **FIXED** - Pushed to main branch (commit 147e297)

All GitHub Actions workflows now consistently use `npm`:
- ✅ `ci.yml` - Uses npm
- ✅ `ci-cd.yml` - Uses npm  
- ✅ `pages.yml` - Fixed to use npm
- ✅ `release.yml` - Fixed to use npm
- ✅ `keep-backend-warm.yml` - Doesn't need package manager

## Verification
The workflows should now build successfully. Check:
- https://github.com/chiampee/SmarTrack/actions

## Prevention
When creating new GitHub Actions workflows:
1. Always use `npm` (not `pnpm` or `yarn`)
2. Use `cache: npm` in setup-node action
3. Use `npm ci` for installation (not `npm install`)
4. Use `npm run <script>` for running scripts

## Package Managers in This Project
- **Frontend**: npm (package-lock.json)
- **Backend**: pip (Python, requirements.txt)
- **Extension**: No build step needed

Always match the workflow package manager to the project's lock file!
