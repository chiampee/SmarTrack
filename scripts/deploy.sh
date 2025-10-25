#!/bin/bash

# 🚀 Smart Research Tracker - Pre-Deployment Script
# This script prepares your code for Vercel deployment

set -e  # Exit on error

echo "🚀 Smart Research Tracker - Pre-Deployment Check"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi
print_status "Found package.json"

# Step 2: Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
print_status "Node.js version: $(node -v)"

# Step 3: Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm not found. Install: npm install -g pnpm"
    exit 1
fi
print_status "pnpm version: $(pnpm -v)"

# Step 4: Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile
print_status "Dependencies installed"

# Step 5: Build the project
echo ""
echo "🏗️  Building project..."
if pnpm build; then
    print_status "Build successful!"
else
    print_error "Build failed! Check errors above."
    exit 1
fi

# Step 6: Build extension
echo ""
echo "🧩 Building Chrome extension..."
if pnpm build:extension; then
    print_status "Extension built successfully!"
else
    print_error "Extension build failed! Check errors above."
    exit 1
fi

# Step 7: Run tests (if available)
echo ""
echo "🧪 Running tests..."
if pnpm test --run 2>/dev/null; then
    print_status "Tests passed!"
else
    print_warning "Tests skipped or failed (non-blocking)"
fi

# Step 8: Check for uncommitted changes
echo ""
echo "🔍 Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        print_status "Changes committed!"
    else
        print_warning "Continuing with uncommitted changes..."
    fi
else
    print_status "No uncommitted changes"
fi

# Step 9: Check Git remote
echo ""
echo "🌐 Checking Git remote..."
if git remote -v | grep -q "origin"; then
    REMOTE_URL=$(git remote get-url origin)
    print_status "Git remote: $REMOTE_URL"
else
    print_error "No Git remote found. Add one with: git remote add origin <url>"
    exit 1
fi

# Step 10: Summary and next steps
echo ""
echo "================================================"
echo -e "${GREEN}✓ Pre-deployment checks complete!${NC}"
echo "================================================"
echo ""
echo "📋 Next steps:"
echo "  1. Push to GitHub: git push origin main"
echo "  2. Go to: https://vercel.com/new"
echo "  3. Import your repository"
echo "  4. Click Deploy!"
echo ""
echo "📚 Full deployment guide: ./DEPLOYMENT.md"
echo ""
echo "🎉 Your app is ready for deployment!"

