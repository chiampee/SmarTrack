#!/bin/bash

# This script creates an Automator app for Smart Research Tracker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
APP_NAME="Smart Research Tracker"

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

print_status "Creating Automator app for Smart Research Tracker..."

# Check if Automator is available
if ! command -v osascript &> /dev/null; then
    print_error "osascript is not available. This script requires macOS."
    exit 1
fi

# Check if the project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    print_error "package.json not found in $PROJECT_DIR"
    exit 1
fi

# Remove existing app if it exists
if [ -d "$PROJECT_DIR/$APP_NAME.app" ]; then
    print_warning "Removing existing app..."
    rm -rf "$PROJECT_DIR/$APP_NAME.app"
fi

# Create the Automator app with improved script
osascript <<EOF
tell application "Automator"
    set newWorkflow to make new workflow
    set kind of newWorkflow to application
    set name of newWorkflow to "$APP_NAME"
    
    -- Add "Run Shell Script" action
    set shellAction to make new action with properties {name:"Run Shell Script"}
    add shellAction to newWorkflow
    
    -- Set the shell script content with error handling
    set scriptContent to "#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR=\"$PROJECT_DIR\"
cd \"\$SCRIPT_DIR\"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    osascript -e 'display dialog \"pnpm is not installed. Please install it first by running: npm install -g pnpm\" buttons {\"OK\"} default button \"OK\" with icon caution'
    exit 1
fi

# Check if dependencies are installed
if [ ! -d \"node_modules\" ]; then
    osascript -e 'display dialog \"Installing dependencies... This may take a moment.\" buttons {\"OK\"} default button \"OK\"'
    pnpm install
fi

# Start the development server
osascript -e 'display dialog \"Starting Smart Research Tracker...\" buttons {\"OK\"} default button \"OK\"'

# Open browser after a short delay
(sleep 3 && open http://localhost:5174) &

# Start the server
pnpm dev"
    
    set value of shellAction to scriptContent
    
    -- Save the app
    save newWorkflow in "$PROJECT_DIR/$APP_NAME.app"
    close newWorkflow
end tell
EOF

if [ $? -eq 0 ]; then
    print_success "Automator app created: $PROJECT_DIR/$APP_NAME.app"
    print_success "You can now double-click the app to start Smart Research Tracker!"
    echo ""
    print_status "App features:"
    echo "  • Automatic dependency checking"
    echo "  • Automatic pnpm installation if missing"
    echo "  • Automatic browser opening"
    echo "  • Error handling with user-friendly dialogs"
    echo ""
    print_warning "Note: The first time you run the app, macOS may ask for permission to run it."
    echo "Right-click the app and select 'Open' if needed."
else
    print_error "Failed to create Automator app"
    exit 1
fi
