@echo off
echo 🚀 Smart Research Tracker - Windows Launcher
echo ============================================
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo ⚠️  node_modules not found. Installing dependencies...
    pnpm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env.local exists
if not exist .env.local (
    echo ⚠️  .env.local not found. Creating default configuration...
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
echo 🎯 Starting Smart Research Tracker...
echo.
echo 📱 Dashboard will be available at: http://localhost:5173
echo 🔗 Test page: http://localhost:5173/test-extension.html
echo.
echo 💡 Press Ctrl+C to stop the server
echo.

REM Start the development server
pnpm dev

echo.
echo 👋 Server stopped. Thanks for using Smart Research Tracker!
pause 