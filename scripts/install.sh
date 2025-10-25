#!/bin/bash

# Smart Research Tracker Installation Script
echo "🚀 Smart Research Tracker - Installation Script"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if pnpm is installed, install if not
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
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
    echo "✅ Created .env.local file"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the development server: pnpm dev"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Install the browser extension:"
echo "   - Go to chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'extension' folder"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
echo "🚀 Happy researching!" 