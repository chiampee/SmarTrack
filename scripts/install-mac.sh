#!/bin/bash

# Smart Research Tracker - macOS Installation Script
echo "🍎 Smart Research Tracker - macOS Installation"
echo "=============================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS only."
    echo "   Use scripts/install.sh for other Unix systems."
    exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "🍺 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi

echo "✅ Homebrew version: $(brew --version | head -n1)"

# Check if Node.js is installed via Homebrew
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js via Homebrew..."
    brew install node
elif ! brew list node &> /dev/null; then
    echo "📦 Updating Node.js via Homebrew..."
    brew upgrade node
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "📦 Updating Node.js to latest version..."
    brew upgrade node
fi

echo "✅ Node.js version: $(node -v)"

# Install pnpm via Homebrew
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm via Homebrew..."
    brew install pnpm
fi

echo "✅ pnpm version: $(pnpm --version)"

# Install dependencies
echo "📦 Installing project dependencies..."
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

# macOS-specific optimizations
echo "🍎 Applying macOS optimizations..."

# Check if Chrome is installed
if [ -d "/Applications/Google Chrome.app" ]; then
    echo "✅ Google Chrome detected"
else
    echo "⚠️  Google Chrome not found. Please install it for the extension to work."
    echo "   Download from: https://www.google.com/chrome/"
fi

# Create desktop shortcut (optional)
read -p "📱 Create desktop shortcut? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📱 Creating desktop shortcut..."
    cat > ~/Desktop/Smart\ Research\ Tracker.command << EOF
#!/bin/bash
cd "$(dirname "$0")/../$(basename "$PWD")"
pnpm dev
EOF
    chmod +x ~/Desktop/Smart\ Research\ Tracker.command
    echo "✅ Desktop shortcut created!"
fi

# Add to Applications folder (optional)
read -p "📂 Add to Applications folder? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📂 Creating application bundle..."
    mkdir -p ~/Applications/Smart\ Research\ Tracker.app/Contents/MacOS
    cat > ~/Applications/Smart\ Research\ Tracker.app/Contents/Info.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Smart Research Tracker</string>
    <key>CFBundleIdentifier</key>
    <string>com.smartresearchtracker.app</string>
    <key>CFBundleName</key>
    <string>Smart Research Tracker</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
</dict>
</plist>
EOF
    cat > ~/Applications/Smart\ Research\ Tracker.app/Contents/MacOS/Smart\ Research\ Tracker << EOF
#!/bin/bash
cd "$PWD"
pnpm dev
EOF
    chmod +x ~/Applications/Smart\ Research\ Tracker.app/Contents/MacOS/Smart\ Research\ Tracker
    echo "✅ Application bundle created!"
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
echo "🍎 macOS Features:"
echo "- Homebrew package management"
echo "- Automatic Chrome detection"
echo "- Desktop shortcut (if created)"
echo "- Application bundle (if created)"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
echo "🚀 Happy researching!" 