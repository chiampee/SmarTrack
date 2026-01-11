#!/bin/bash
# Package Chrome Extension for Store Submission

# Extract version from manifest.json
VERSION=$(grep '"version"' manifest.json | head -1 | awk -F '"' '{print $4}')
FILENAME="../SmarTrack-extension-v${VERSION}.zip"

echo "📦 Packing SmarTrack Chrome Extension v${VERSION}..."

# Remove old zip if exists
rm -f "$FILENAME"
rm -f ../SmarTrack-extension.zip

# Create zip file excluding unnecessary files
zip -r "$FILENAME" . \
  -x "*.DS_Store" \
  -x "*__MACOSX*" \
  -x "README.md" \
  -x "CHROME_STORE_LISTING.md" \
  -x "*.sh" \
  -x "*.svg"

echo "✅ Extension packaged: $FILENAME"
echo ""
echo "📤 Upload this file to Chrome Web Store:"
echo "   https://chrome.google.com/webstore/devconsole/"

