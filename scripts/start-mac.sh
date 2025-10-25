#!/bin/bash

# Smart Research Tracker - macOS Launcher
echo "🍎 Starting Smart Research Tracker..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Smart Research Tracker Environment Variables
# Add your API keys here (optional)

# OpenAI (optional)
# VITE_OPENAI_API_KEY=your_openai_key_here

# Mistral (optional)
# VITE_MISTRAL_API_KEY=your_mistral_key_here

# Together AI (optional)
# VITE_TOGETHER_API_KEY=your_together_key_here

# Groq (optional)
# VITE_GROQ_API_KEY=your_groq_key_here

# Fireworks AI (optional)
# VITE_FIREWORKS_API_KEY=your_fireworks_key_here
EOF
fi

# Start the development server
echo "🚀 Starting development server..."
echo "📱 Dashboard will be available at: http://localhost:5173"
echo "🔗 Test page: http://localhost:5173/test-extension.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

pnpm dev 