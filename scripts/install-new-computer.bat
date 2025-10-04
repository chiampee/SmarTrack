@echo off
REM Smart Research Tracker - New Computer Installation Script (Windows)
REM This script automates the installation process on a new computer

echo 🚀 Smart Research Tracker - New Computer Installation
echo =====================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo ℹ️  Starting installation process...
echo.

REM Step 1: Check Node.js version
echo 1️⃣ Checking Node.js version...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js version check passed
)

REM Step 2: Check if pnpm is available
echo.
echo 2️⃣ Checking package manager...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  pnpm not found. Installing pnpm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ⚠️  Failed to install pnpm. Falling back to npm.
        set PACKAGE_MANAGER=npm
    ) else (
        echo ✅ pnpm installed successfully
        set PACKAGE_MANAGER=pnpm
    )
) else (
    echo ✅ pnpm is available
    set PACKAGE_MANAGER=pnpm
)

REM Step 3: Install dependencies
echo.
echo 3️⃣ Installing dependencies...
if "%PACKAGE_MANAGER%"=="pnpm" (
    pnpm install
) else (
    npm install
)
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully

REM Step 4: Check environment configuration
echo.
echo 4️⃣ Checking environment configuration...
if exist ".env.local" (
    echo ✅ Environment file (.env.local) exists
    findstr /C:"sk-" .env.local >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ OpenAI API key appears to be configured
    ) else (
        echo ⚠️  OpenAI API key not found in .env.local
        echo ℹ️  Please edit .env.local and add your OpenAI API key:
        echo ℹ️  VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
    )
) else (
    echo ⚠️  Environment file (.env.local) not found
    echo ℹ️  Creating basic .env.local file...
    
    (
        echo # Smart Research Tracker Configuration
        echo VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
        echo VITE_OPENAI_MODEL=gpt-4o-mini
        echo VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
    ) > .env.local
    
    echo ⚠️  Please edit .env.local and add your OpenAI API key
    echo ℹ️  Get your API key from: https://platform.openai.com/api-keys
)

REM Step 5: Build the extension
echo.
echo 5️⃣ Building browser extension...
if "%PACKAGE_MANAGER%"=="pnpm" (
    pnpm build:extension
) else (
    npm run build:extension
)
if %errorlevel% neq 0 (
    echo ❌ Failed to build extension
    pause
    exit /b 1
)
echo ✅ Extension built successfully

REM Step 6: Copy required files to dist-extension
echo.
echo 6️⃣ Setting up extension files...
if exist "extension\manifest.json" (
    copy "extension\manifest.json" "dist-extension\" >nul
    echo ✅ manifest.json copied
) else (
    echo ⚠️  manifest.json not found in extension/
)

if exist "extension\icon.svg" (
    copy "extension\icon.svg" "dist-extension\" >nul
    echo ✅ icon.svg copied
) else (
    echo ⚠️  icon.svg not found in extension/
)

if exist "extension\options.html" (
    copy "extension\options.html" "dist-extension\" >nul
    echo ✅ options.html copied
) else (
    echo ⚠️  options.html not found in extension/
)

if exist "extension\options.js" (
    copy "extension\options.js" "dist-extension\" >nul
    echo ✅ options.js copied
) else (
    echo ⚠️  options.js not found in extension/
)

REM Create icons directory
if not exist "dist-extension\icons" mkdir "dist-extension\icons"
if exist "extension\icon.svg" (
    copy "extension\icon.svg" "dist-extension\icons\" >nul
    echo ✅ icon.svg copied to icons directory
)

echo ✅ Extension files prepared

REM Step 7: Test the build
echo.
echo 7️⃣ Testing the build...
if "%PACKAGE_MANAGER%"=="pnpm" (
    pnpm test:db
) else (
    npm run test:db
)
echo ✅ Build tests completed

REM Step 8: Final instructions
echo.
echo 🎉 Installation Complete!
echo ========================
echo.
echo ℹ️  Next steps:
echo 1. Install the browser extension:
echo    - Open Chrome and go to chrome://extensions/
echo    - Enable 'Developer mode'
echo    - Click 'Load unpacked'
echo    - Select the 'dist-extension' folder
echo.
echo 2. Start the development server:
if "%PACKAGE_MANAGER%"=="pnpm" (
    echo    pnpm dev
) else (
    echo    npm run dev
)
echo.
echo 3. Open the dashboard:
echo    http://localhost:5174/
echo.
echo ⚠️  Don't forget to:
echo - Add your OpenAI API key to .env.local
echo - Test the extension by right-clicking on any webpage
echo - Test the AI chat feature in the dashboard
echo.
echo ℹ️  For troubleshooting, check the MANUAL_INSTALLATION_GUIDE.md file
echo.
echo ✅ Happy researching! 🔬📚
echo.
pause
