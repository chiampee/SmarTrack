#!/bin/bash

# Smart Research Tracker Environment Setup Script
# This script helps you configure your environment variables for the AI chat functionality

echo "🚀 Smart Research Tracker Environment Setup"
echo "=========================================="
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Do you want to overwrite it? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "📝 Setting up environment variables..."
echo ""

# Get OpenAI API Key
echo "🔑 Please enter your OpenAI API Key (starts with 'sk-'):"
echo "   If you don't have one, visit: https://platform.openai.com/api-keys"
read -r OPENAI_API_KEY

# Validate API key format
if [[ ! "$OPENAI_API_KEY" =~ ^sk-[a-zA-Z0-9]{20,}$ ]]; then
    echo "❌ Invalid API key format. OpenAI API keys should start with 'sk-' and be at least 20 characters long."
    exit 1
fi

# Create .env.local file
cat > .env.local << EOF
# Smart Research Tracker Configuration
# Generated automatically during setup

# OpenAI API Configuration
VITE_OPENAI_API_KEY=$OPENAI_API_KEY

# Optional: Customize AI behavior
VITE_OPENAI_MODEL=gpt-4o
VITE_OPENAI_EMBED_MODEL=text-embedding-3-large

# Optional: Custom settings
VITE_MAX_SUMMARY_LENGTH=500
VITE_ENABLE_ANALYTICS=false
EOF

echo ""
echo "✅ Environment variables configured successfully!"
echo ""
echo "📋 Configuration summary:"
echo "   - OpenAI API Key: ${OPENAI_API_KEY:0:10}..."
echo "   - Model: gpt-4o"
echo "   - Embedding Model: text-embedding-3-large"
echo ""
echo "🔄 Please restart your development server:"
echo "   npm run dev"
echo ""
echo "🎯 You can now use the AI chat functionality!"
echo ""
echo "💡 Tips:"
echo "   - Make sure your OpenAI account has sufficient credits"
echo "   - The API key is stored locally in .env.local"
echo "   - You can modify settings in .env.local anytime"
echo "" 