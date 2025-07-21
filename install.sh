#!/bin/bash

echo "🚀 Smart Research Tracker - Quick Install"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "   Please install Node.js from https://nodejs.org/"
    echo "   Then run this script again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: You're using Node.js version $(node -v)"
    echo "   Smart Research Tracker works best with Node.js 18 or higher"
    echo "   Consider updating: https://nodejs.org/"
    echo ""
fi

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install pnpm. Please install it manually:"
        echo "   npm install -g pnpm"
        echo "   or visit: https://pnpm.io/installation"
        exit 1
    fi
    echo "✅ pnpm installed successfully"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Run setup if .env.local doesn't exist
if [ ! -f ".env.local" ]; then
    echo ""
    echo "🔧 Running setup..."
    pnpm setup
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "🚀 To start the app:"
echo "   pnpm dev"
echo ""
echo "🌐 Then open: http://localhost:5173"
echo ""
echo "📖 For more help, check the README.md file" 