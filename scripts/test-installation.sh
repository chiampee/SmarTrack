#!/bin/bash

# Smart Research Tracker - Installation Test Script
echo "🧪 Testing Smart Research Tracker Installation"
echo "=============================================="

# Test 1: Check if Node.js is installed
echo "📋 Test 1: Node.js Installation"
if command -v node &> /dev/null; then
    echo "✅ Node.js is installed: $(node --version)"
else
    echo "❌ Node.js is not installed"
    exit 1
fi

# Test 2: Check if pnpm is installed
echo "📋 Test 2: pnpm Installation"
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm is installed: $(pnpm --version)"
else
    echo "❌ pnpm is not installed"
    exit 1
fi

# Test 3: Check if dependencies are installed
echo "📋 Test 3: Dependencies"
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "❌ node_modules directory not found"
    exit 1
fi

# Test 4: Check if .env.local exists
echo "📋 Test 4: Environment Configuration"
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
else
    echo "⚠️  .env.local file not found (optional)"
fi

# Test 5: Check if extension files exist
echo "📋 Test 5: Extension Files"
if [ -f "extension/manifest.json" ]; then
    echo "✅ extension/manifest.json exists"
else
    echo "❌ extension/manifest.json not found"
    exit 1
fi

if [ -f "extension/popup.html" ]; then
    echo "✅ extension/popup.html exists"
else
    echo "❌ extension/popup.html not found"
    exit 1
fi

if [ -f "extension/popup.js" ]; then
    echo "✅ extension/popup.js exists"
else
    echo "❌ extension/popup.js not found"
    exit 1
fi

if [ -f "extension/background.js" ]; then
    echo "✅ extension/background.js exists"
else
    echo "❌ extension/background.js not found"
    exit 1
fi

if [ -f "extension/contentScript.js" ]; then
    echo "✅ extension/contentScript.js exists"
else
    echo "❌ extension/contentScript.js not found"
    exit 1
fi

# Test 6: Check if test page exists
echo "📋 Test 6: Test Page"
if [ -f "test-extension.html" ]; then
    echo "✅ test-extension.html exists"
else
    echo "❌ test-extension.html not found"
    exit 1
fi

# Test 7: Check if development server can start
echo "📋 Test 7: Development Server"
echo "🔄 Starting development server in background..."
pnpm dev > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test if server is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200"; then
    echo "✅ Development server is running on http://localhost:5173"
else
    echo "❌ Development server is not responding"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Test if test page is accessible
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/test-extension.html | grep -q "200"; then
    echo "✅ Test page is accessible at http://localhost:5173/test-extension.html"
else
    echo "❌ Test page is not accessible"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Stop the server
kill $SERVER_PID 2>/dev/null

# Test 8: Check if Chrome is installed (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📋 Test 8: Chrome Installation (macOS)"
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo "✅ Google Chrome is installed"
    else
        echo "⚠️  Google Chrome not found - extension won't work"
    fi
fi

# Test 9: Check if application bundle was created (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📋 Test 9: Application Bundle (macOS)"
    if [ -d "$HOME/Applications/Smart Research Tracker.app" ]; then
        echo "✅ Application bundle exists"
    else
        echo "ℹ️  Application bundle not found (optional)"
    fi
fi

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the development server: pnpm dev"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Install the browser extension:"
echo "   - Go to chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'extension' folder"
echo "4. Test the extension: http://localhost:5173/test-extension.html"
echo ""
echo "🚀 Happy researching!" 