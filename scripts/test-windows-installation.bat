@echo off
echo 🧪 Testing Windows Installation
echo ================================
echo.

REM Test 1: Check Node.js
echo 📋 Test 1: Node.js Installation
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js is installed
    for /f "tokens=*" %%i in ('node --version') do echo    Version: %%i
) else (
    echo ❌ Node.js is not installed
    echo    Please install Node.js from https://nodejs.org/
)
echo.

REM Test 2: Check pnpm
echo 📋 Test 2: pnpm Installation
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ pnpm is installed
    for /f "tokens=*" %%i in ('pnpm --version') do echo    Version: %%i
) else (
    echo ❌ pnpm is not installed
    echo    Run: npm install -g pnpm
)
echo.

REM Test 3: Check project dependencies
echo 📋 Test 3: Project Dependencies
if exist node_modules (
    echo ✅ node_modules directory exists
    if exist node_modules\.pnpm (
        echo ✅ pnpm dependencies are installed
    ) else (
        echo ⚠️  node_modules exists but may not be pnpm dependencies
    )
) else (
    echo ❌ node_modules directory not found
    echo    Run: pnpm install
)
echo.

REM Test 4: Check .env.local
echo 📋 Test 4: Environment Configuration
if exist .env.local (
    echo ✅ .env.local file exists
) else (
    echo ⚠️  .env.local file not found
    echo    This is optional but recommended for API keys
)
echo.

REM Test 5: Check extension files
echo 📋 Test 5: Extension Files
if exist extension (
    echo ✅ extension directory exists
    if exist extension\manifest.json (
        echo ✅ manifest.json exists
    ) else (
        echo ❌ manifest.json not found in extension directory
    )
    if exist extension\popup.html (
        echo ✅ popup.html exists
    ) else (
        echo ❌ popup.html not found in extension directory
    )
    if exist extension\background.js (
        echo ✅ background.js exists
    ) else (
        echo ❌ background.js not found in extension directory
    )
    if exist extension\contentScript.js (
        echo ✅ contentScript.js exists
    ) else (
        echo ❌ contentScript.js not found in extension directory
    )
) else (
    echo ❌ extension directory not found
)
echo.

REM Test 6: Check package.json scripts
echo 📋 Test 6: Package Scripts
if exist package.json (
    echo ✅ package.json exists
    findstr /C:"dev" package.json >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ dev script found
    ) else (
        echo ❌ dev script not found in package.json
    )
    findstr /C:"build" package.json >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ build script found
    ) else (
        echo ❌ build script not found in package.json
    )
) else (
    echo ❌ package.json not found
)
echo.

REM Test 7: Check Vite configuration
echo 📋 Test 7: Vite Configuration
if exist vite.config.ts (
    echo ✅ vite.config.ts exists
) else (
    echo ❌ vite.config.ts not found
)
echo.

REM Test 8: Check TypeScript configuration
echo 📋 Test 8: TypeScript Configuration
if exist tsconfig.json (
    echo ✅ tsconfig.json exists
) else (
    echo ❌ tsconfig.json not found
)
echo.

REM Test 9: Check for test files
echo 📋 Test 9: Test Files
if exist test-extension.html (
    echo ✅ test-extension.html exists
) else (
    echo ❌ test-extension.html not found
)
echo.

REM Test 10: Check for documentation
echo 📋 Test 10: Documentation
if exist README.md (
    echo ✅ README.md exists
) else (
    echo ❌ README.md not found
)
if exist docs (
    echo ✅ docs directory exists
) else (
    echo ❌ docs directory not found
)
echo.

echo ================================
echo 🎯 Installation Test Summary
echo ================================

REM Count successes and failures
set /a success=0
set /a failure=0

REM Count Node.js
node --version >nul 2>&1 && set /a success+=1 || set /a failure+=1

REM Count pnpm
pnpm --version >nul 2>&1 && set /a success+=1 || set /a failure+=1

REM Count node_modules
if exist node_modules set /a success+=1 || set /a failure+=1

REM Count .env.local
if exist .env.local set /a success+=1 || set /a failure+=1

REM Count extension
if exist extension set /a success+=1 || set /a failure+=1

REM Count package.json
if exist package.json set /a success+=1 || set /a failure+=1

REM Count vite.config.ts
if exist vite.config.ts set /a success+=1 || set /a failure+=1

REM Count tsconfig.json
if exist tsconfig.json set /a success+=1 || set /a failure+=1

REM Count test-extension.html
if exist test-extension.html set /a success+=1 || set /a failure+=1

REM Count README.md
if exist README.md set /a success+=1 || set /a failure+=1

echo.
echo 📊 Results: %success% passed, %failure% failed
echo.

if %failure% equ 0 (
    echo 🎉 All tests passed! Installation is complete.
    echo.
    echo 🚀 Next steps:
    echo 1. Start the development server: pnpm dev
    echo 2. Open http://localhost:5173 in your browser
    echo 3. Install the browser extension
    echo.
    echo 📖 For detailed instructions, see README.md
) else (
    echo ⚠️  Some tests failed. Please check the issues above.
    echo.
    echo 🔧 Troubleshooting:
    echo 1. Run the installation script: scripts\install.bat
    echo 2. Check the README.md for detailed instructions
    echo 3. Ensure you have Node.js v16+ installed
    echo.
    echo 💡 Need help? Check the documentation or create an issue.
)

echo.
echo 🧪 Test completed at %date% %time%
pause 