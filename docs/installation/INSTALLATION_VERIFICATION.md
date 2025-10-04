# Installation Verification Checklist

## ✅ Pre-Installation Checks

### System Requirements
- [ ] **Node.js 18+** installed and accessible
- [ ] **Chrome Browser** installed
- [ ] **Terminal/Command Prompt** access
- [ ] **OpenAI API Key** obtained

### Project Files
- [ ] `package.json` exists in project root
- [ ] `src/` directory with source code
- [ ] `extension/` directory with extension files
- [ ] `scripts/` directory with installation scripts

## ✅ Installation Script Verification

### Linux/macOS Script (`install-new-computer.sh`)
- [ ] Script has execute permissions (`chmod +x`)
- [ ] Bash syntax is valid (`bash -n scripts/install-new-computer.sh`)
- [ ] All required commands are present
- [ ] Error handling is implemented
- [ ] File paths use forward slashes

### Windows Script (`install-new-computer.bat`)
- [ ] Batch file syntax is valid
- [ ] All required commands are present
- [ ] Error handling is implemented
- [ ] File paths use backslashes for Windows
- [ ] Pause commands for user interaction

## ✅ Package.json Scripts Verification

### Required Scripts
- [ ] `dev` - Start development server
- [ ] `build` - Build web application
- [ ] `build:extension` - Build browser extension
- [ ] `test:db` - Test database operations
- [ ] `test:chat` - Test chat functionality

### Script Commands Tested
- [ ] `pnpm dev` works (starts server on port 5174)
- [ ] `pnpm build:extension` works (creates dist-extension/)
- [ ] `pnpm test:db` passes all checks
- [ ] `pnpm test:chat` passes all checks

## ✅ Extension Files Verification

### Required Files in `extension/`
- [ ] `manifest.json` - Extension manifest
- [ ] `background.js` - Background script
- [ ] `contentScript.js` - Content script
- [ ] `popup.html` - Extension popup
- [ ] `popup.js` - Popup script
- [ ] `options.html` - Options page
- [ ] `options.js` - Options script
- [ ] `icons/icon.svg` - Extension icon

### Files Copied to `dist-extension/`
- [ ] `manifest.json` copied
- [ ] `icon.svg` copied
- [ ] `options.html` copied
- [ ] `options.js` copied
- [ ] `icons/` directory created
- [ ] `icon.svg` copied to `icons/`

## ✅ Environment Configuration

### `.env.local` File
- [ ] File is created by installation script
- [ ] Contains `VITE_OPENAI_API_KEY` placeholder
- [ ] Contains `VITE_OPENAI_MODEL=gpt-4o-mini`
- [ ] Contains `VITE_OPENAI_EMBED_MODEL=text-embedding-3-small`
- [ ] User can replace placeholder with real API key

## ✅ Database Schema Verification

### Required Tables
- [ ] `chatMessages` table defined
- [ ] `conversations` table defined
- [ ] `links` table defined
- [ ] `summaries` table defined
- [ ] `boards` table defined
- [ ] `settings` table defined
- [ ] `tasks` table defined

### Required Methods
- [ ] `addChatMessage()` method
- [ ] `getChatMessagesByConversation()` method
- [ ] `addConversation()` method
- [ ] `getActiveConversationByLinks()` method

## ✅ Test Scripts Verification

### Database Test (`test:db`)
- [ ] Checks database schema correctly
- [ ] Verifies chat service methods
- [ ] Checks MultiChatPanel functionality
- [ ] Validates TypeScript types
- [ ] All tests pass

### Chat Test (`test:chat`)
- [ ] Checks API key configuration
- [ ] Verifies database schema
- [ ] Tests chat service methods
- [ ] Checks MultiChatPanel functionality
- [ ] Validates TypeScript compilation
- [ ] All tests pass

## ✅ Documentation Verification

### Installation Guides
- [ ] `MANUAL_INSTALLATION_GUIDE.md` - Complete step-by-step guide
- [ ] `INSTALLATION_README.md` - Quick reference
- [ ] `INSTALLATION_VERIFICATION.md` - This checklist

### Script Instructions
- [ ] Clear error messages
- [ ] Helpful next steps
- [ ] Troubleshooting guidance
- [ ] Platform-specific instructions

## ✅ Final Verification Steps

### Before Testing on New Systems
1. [ ] Run `pnpm test:db` - should pass all checks
2. [ ] Run `pnpm test:chat` - should pass all checks
3. [ ] Run `pnpm build:extension` - should complete successfully
4. [ ] Check `dist-extension/` folder has all required files
5. [ ] Verify `.env.local` template is created correctly

### Expected Installation Flow
1. [ ] User runs installation script
2. [ ] Script checks Node.js version
3. [ ] Script installs pnpm if needed
4. [ ] Script installs dependencies
5. [ ] Script creates `.env.local` template
6. [ ] Script builds extension
7. [ ] Script copies required files
8. [ ] Script runs tests
9. [ ] Script provides next steps

## 🎯 Ready for Testing

The installation scripts and documentation are now verified and ready for testing on new Windows and Linux systems.

### Test Commands
```bash
# Linux/macOS
./scripts/install-new-computer.sh

# Windows
scripts\install-new-computer.bat
```

### Expected Results
- All tests should pass
- Extension should build successfully
- Dashboard should start on port 5174
- User should be able to install extension in Chrome
- All functionality should work as expected
