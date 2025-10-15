#!/bin/bash

# Create Desktop Shortcut for Smart Research Tracker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$HOME/Desktop"
SHORTCUT_NAME="Smart Research Tracker"

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_status "Creating desktop shortcut for Smart Research Tracker..."

# Check if Desktop directory exists
if [ ! -d "$DESKTOP_DIR" ]; then
    print_error "Desktop directory not found: $DESKTOP_DIR"
    exit 1
fi

# Create the shortcut script
SHORTCUT_SCRIPT="$DESKTOP_DIR/$SHORTCUT_NAME.command"

cat > "$SHORTCUT_SCRIPT" << 'EOF'
#!/bin/bash

# Smart Research Tracker Desktop Shortcut
# This script runs when you double-click the desktop shortcut

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🚀 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for server to start
wait_for_server() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:5174 >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    return 1
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/Users/chaim/Documents/Cursor 8.7"

# Change to project directory
cd "$PROJECT_DIR"

print_status "Starting Smart Research Tracker..."
echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Check if Node.js is installed
if ! command_exists node; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version is $NODE_VERSION. Recommended: 18+"
fi

# Check if pnpm is installed
if ! command_exists pnpm; then
    print_error "pnpm is not installed!"
    echo "Installing pnpm..."
    if npm install -g pnpm; then
        print_success "pnpm installed successfully!"
    else
        print_error "Failed to install pnpm. Please install manually: npm install -g pnpm"
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in $PROJECT_DIR"
    echo "Please make sure the project is in the correct directory."
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    if pnpm install; then
        print_success "Dependencies installed successfully!"
    else
        print_error "Failed to install dependencies"
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. AI features may not work."
    echo "To enable AI features, create .env.local with your OpenAI API key:"
    echo "VITE_OPENAI_API_KEY=sk-your-key-here"
    echo ""
fi

print_status "Starting development server..."
echo "🔗 The app will open at: http://localhost:5174"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Open browser after server starts
{
    if wait_for_server; then
        print_success "Server is ready! Opening browser..."
        open http://localhost:5174
    else
        print_warning "Server may not be ready yet. Please open http://localhost:5174 manually."
    fi
} &

# Start the server
pnpm dev
EOF

# Make the shortcut executable
chmod +x "$SHORTCUT_SCRIPT"

if [ $? -eq 0 ]; then
    print_success "Desktop shortcut created: $SHORTCUT_SCRIPT"
    print_success "You can now double-click the shortcut on your desktop to start Smart Research Tracker!"
    echo ""
    print_status "Shortcut features:"
    echo "  • Automatic dependency checking"
    echo "  • Automatic pnpm installation if missing"
    echo "  • Server readiness detection"
    echo "  • Automatic browser opening"
    echo "  • Environment file checking"
    echo "  • Colored output for better readability"
    echo ""
    print_warning "Note: The first time you run the shortcut, macOS may ask for permission to run it."
    echo "Right-click the shortcut and select 'Open' if needed."
else
    print_error "Failed to create desktop shortcut"
    exit 1
fi
