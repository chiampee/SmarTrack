#!/bin/bash

# Chrome Web Store Extension Packaging Script for SmarTrack
# This script creates a clean, submission-ready zip file

echo "🎯 SmarTrack - Chrome Web Store Packaging Script"
echo "=================================================="
echo ""

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
EXTENSION_NAME="SmarTrack-extension"
VERSION="1.0.0"
OUTPUT_DIR="../"
ZIP_NAME="${EXTENSION_NAME}-v${VERSION}.zip"

echo "📦 Extension: $EXTENSION_NAME"
echo "🏷️  Version: $VERSION"
echo ""

# Check if we're in the extension directory
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ Error: manifest.json not found${NC}"
    echo "Please run this script from the extension/ directory"
    exit 1
fi

echo "✅ Found manifest.json"

# Validate manifest version matches
MANIFEST_VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo "📋 Manifest version: $MANIFEST_VERSION"

if [ "$MANIFEST_VERSION" != "$VERSION" ]; then
    echo -e "${YELLOW}⚠️  Warning: Version mismatch!${NC}"
    echo "   Script version: $VERSION"
    echo "   Manifest version: $MANIFEST_VERSION"
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Check required files
echo ""
echo "🔍 Checking required files..."

REQUIRED_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "background.js"
    "contentScript.js"
    "icons/icon16.png"
    "icons/icon32.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

ALL_GOOD=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file (MISSING)"
        ALL_GOOD=false
    fi
done

if [ "$ALL_GOOD" = false ]; then
    echo -e "${RED}❌ Error: Missing required files${NC}"
    exit 1
fi

# Create temporary directory for clean packaging
TEMP_DIR=$(mktemp -d)
echo ""
echo "📂 Creating temporary directory: $TEMP_DIR"

# Copy files to temp directory (exclude unwanted files)
echo "📋 Copying files..."
rsync -av \
    --exclude='.git*' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    --exclude='*.md' \
    --exclude='*.sh' \
    --exclude='*.html' \
    --exclude='package*.json' \
    --exclude='.env*' \
    --exclude='*.log' \
    --exclude='create-promotional-images.html' \
    --exclude='CHROME_STORE_LISTING.md' \
    --exclude='SUBMISSION_CHECKLIST.md' \
    --exclude='UX_UI_IMPROVEMENTS.md' \
    ./ "$TEMP_DIR/" > /dev/null

echo "✅ Files copied to temporary directory"

# Create the zip file
echo ""
echo "🗜️  Creating zip file..."
cd "$TEMP_DIR"
zip -r "$ZIP_NAME" . -q

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Zip file created successfully${NC}"
else
    echo -e "${RED}❌ Error creating zip file${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Move zip to output directory
mv "$ZIP_NAME" "$OUTPUT_DIR/$ZIP_NAME"
echo "📦 Moved to: $OUTPUT_DIR/$ZIP_NAME"

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"
echo "🧹 Cleaned up temporary files"

# Show file info
echo ""
echo "📊 Package Information:"
FILE_SIZE=$(du -h "$OUTPUT_DIR/$ZIP_NAME" | cut -f1)
echo "   Size: $FILE_SIZE"
echo "   Location: $OUTPUT_DIR/$ZIP_NAME"

# Verify contents
echo ""
echo "📦 Package Contents:"
unzip -l "$OUTPUT_DIR/$ZIP_NAME" | tail -n +4 | head -n -2

# Final checklist
echo ""
echo "======================================"
echo -e "${GREEN}✨ Package ready for Chrome Web Store!${NC}"
echo "======================================"
echo ""
echo "📝 Next Steps:"
echo "   1. Go to: https://chrome.google.com/webstore/devconsole/"
echo "   2. Click 'New Item'"
echo "   3. Upload: $OUTPUT_DIR/$ZIP_NAME"
echo "   4. Fill in store listing details"
echo "   5. Submit for review"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - CHROME_WEB_STORE_PUBLISHING_GUIDE.md"
echo "   - SUBMISSION_CHECKLIST.md"
echo ""
echo "🎉 Good luck with your submission!"
