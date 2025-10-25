#!/bin/bash

# Smart Research Tracker - New Computer Installation Script
# This script automates the installation process on a new computer

set -e  # Exit on any error

echo "🚀 Smart Research Tracker - New Computer Installation"
echo "====================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_info "Starting installation process..."

# Step 1: Check Node.js version
echo ""
echo "1️⃣ Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_status "Node.js version check passed: $NODE_VERSION"
    else
        print_warning "Node.js version $NODE_VERSION detected. Version 18+ is recommended."
        print_info "Consider updating Node.js: https://nodejs.org/"
    fi
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Step 2: Check if pnpm is available
echo ""
echo "2️⃣ Checking package manager..."
if command -v pnpm &> /dev/null; then
    print_status "pnpm is available"
    PACKAGE_MANAGER="pnpm"
else
    print_warning "pnpm not found. Installing pnpm..."
    if npm install -g pnpm; then
        print_status "pnpm installed successfully"
        PACKAGE_MANAGER="pnpm"
    else
        print_warning "Failed to install pnpm. Falling back to npm."
        PACKAGE_MANAGER="npm"
    fi
fi

# Step 3: Install dependencies
echo ""
echo "3️⃣ Installing dependencies..."
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm install
else
    npm install
fi
print_status "Dependencies installed successfully"

# Step 4: Check environment configuration
echo ""
echo "4️⃣ Checking environment configuration..."
if [ -f ".env.local" ]; then
    print_status "Environment file (.env.local) exists"
    
    # Check if API key is configured
    if grep -q "sk-" .env.local; then
        print_status "OpenAI API key appears to be configured"
    else
        print_warning "OpenAI API key not found in .env.local"
        print_info "Please edit .env.local and add your OpenAI API key:"
        print_info "VITE_OPENAI_API_KEY=sk-your-actual-api-key-here"
    fi
else
    print_warning "Environment file (.env.local) not found"
    print_info "Creating basic .env.local file..."
    
    cat > .env.local << EOF
# Smart Research Tracker Configuration
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
EOF
    
    print_warning "Please edit .env.local and add your OpenAI API key"
    print_info "Get your API key from: https://platform.openai.com/api-keys"
fi

# Step 5: Build the extension
echo ""
echo "5️⃣ Building browser extension..."
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm build:extension
else
    npm run build:extension
fi
print_status "Extension built successfully"

# Step 6: Copy required files to dist-extension
echo ""
echo "6️⃣ Setting up extension files..."
cp extension/manifest.json dist-extension/ 2>/dev/null || print_warning "manifest.json not found in extension/"
cp extension/icon.svg dist-extension/ 2>/dev/null || print_warning "icon.svg not found in extension/"
cp extension/options.html dist-extension/ 2>/dev/null || print_warning "options.html not found in extension/"
cp extension/options.js dist-extension/ 2>/dev/null || print_warning "options.js not found in extension/"

# Create icons directory
mkdir -p dist-extension/icons
cp extension/icon.svg dist-extension/icons/ 2>/dev/null || print_warning "icon.svg not found for icons directory"

print_status "Extension files prepared"

# Step 7: Test the build
echo ""
echo "7️⃣ Testing the build..."
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm test:db
else
    npm run test:db
fi
print_status "Build tests completed"

# Step 8: Final instructions
echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
print_info "Next steps:"
echo "1. Install the browser extension:"
echo "   - Open Chrome and go to chrome://extensions/"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'dist-extension' folder"
echo ""
echo "2. Start the development server:"
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    echo "   pnpm dev"
else
    echo "   npm run dev"
fi
echo ""
echo "3. Open the dashboard:"
echo "   http://localhost:5174/"
echo ""
print_warning "Don't forget to:"
echo "- Add your OpenAI API key to .env.local"
echo "- Test the extension by right-clicking on any webpage"
echo "- Test the AI chat feature in the dashboard"
echo ""
print_info "For troubleshooting, check the MANUAL_INSTALLATION_GUIDE.md file"
echo ""
print_status "Happy researching! 🔬📚"
