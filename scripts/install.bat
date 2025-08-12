@echo off
echo 🚀 Smart Research Tracker - Installation Script
echo ================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if pnpm is installed, install if not
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing pnpm...
    npm install -g pnpm
)

echo ✅ pnpm version:
pnpm --version

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed successfully!
) else (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local file...
    (
        echo # Smart Research Tracker Environment Variables
        echo # Add your API keys here (optional)
        echo.
        echo # OpenAI (optional)
        echo # VITE_OPENAI_API_KEY=your_openai_key_here
        echo.
        echo # Mistral (optional)
        echo # VITE_MISTRAL_API_KEY=your_mistral_key_here
        echo.
        echo # Together AI (optional)
        echo # VITE_TOGETHER_API_KEY=your_together_key_here
        echo.
        echo # Groq (optional)
        echo # VITE_GROQ_API_KEY=your_groq_key_here
        echo.
        echo # Fireworks AI (optional)
        echo # VITE_FIREWORKS_API_KEY=your_fireworks_key_here
    ) > .env.local
    echo ✅ Created .env.local file
)

echo.
echo 🎉 Installation completed successfully!
echo.
echo 📋 Next steps:
echo 1. Start the development server: pnpm dev
echo 2. Open http://localhost:5173 in your browser
echo 3. Install the browser extension:
echo    - Go to chrome://extensions/
echo    - Enable Developer mode
echo    - Click 'Load unpacked'
echo    - Select the 'extension' folder
echo.
echo 📖 For detailed instructions, see README.md
echo.
echo 🚀 Happy researching!
pause 