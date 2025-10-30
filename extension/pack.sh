#!/bin/bash
# Package Chrome Extension for Store Submission

echo "📦 Packing SmarTrack Chrome Extension..."

# Remove old zip if exists
rm -f ../SmarTrack-extension.zip

# Create zip file excluding unnecessary files
zip -r ../SmarTrack-extension.zip . \
  -x "*.DS_Store" \
  -x "*__MACOSX*" \
  -x "README.md" \
  -x "CHROME_STORE_LISTING.md" \
  -x "*.sh" \
  -x "*.svg"

echo "✅ Extension packaged: SmarTrack-extension.zip"
echo ""
echo "📤 Upload this file to Chrome Web Store:"
echo "   https://chrome.google.com/webstore/devconsole/"

