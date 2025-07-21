@echo off
echo 🚀 Smart Research Tracker - Quick Install
echo =========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed.
    echo    Please install Node.js from https://nodejs.org/
    echo    Then run this script again.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% LSS 18 (
    echo ⚠️  Warning: You're using Node.js version 
    node --version
    echo    Smart Research Tracker works best with Node.js 18 or higher
    echo    Consider updating: https://nodejs.org/
    echo.
)

REM Install pnpm if not available
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing pnpm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ❌ Failed to install pnpm. Please install it manually:
        echo    npm install -g pnpm
        echo    or visit: https://pnpm.io/installation
        pause
        exit /b 1
    )
    echo ✅ pnpm installed successfully
)

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Run setup if .env.local doesn't exist
if not exist ".env.local" (
    echo.
    echo 🔧 Running setup...
    pnpm setup
)

echo.
echo 🎉 Installation complete!
echo.
echo 🚀 To start the app:
echo    pnpm dev
echo.
echo 🌐 Then open: http://localhost:5173
echo.
echo 📖 For more help, check the README.md file
pause 