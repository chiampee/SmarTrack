#!/bin/bash

echo "🚀 Deploying SmarTrack to Production"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized"
    echo "Run: git init"
    exit 1
fi

# Check current branch
BRANCH=$(git branch --show-current)
echo "📍 Current branch: $BRANCH"

# Ask for confirmation
read -p "Deploy to production? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "📦 Stage all changes..."
git add .

echo "💾 Commit changes..."
git commit -m "Deploy to production: $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"

echo "⬆️  Push to GitHub..."
git push origin $BRANCH || git push -u origin $BRANCH

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "📋 NEXT STEPS:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  BACKEND DEPLOYMENT (Render):"
echo "   👉 Go to: https://dashboard.render.com"
echo "   👉 Click: 'New +' → 'Web Service'"
echo "   👉 Connect GitHub repo: SmarTrack"
echo "   👉 Config:"
echo "      • Root Directory: backend"
echo "      • Build: pip install -r requirements.txt"
echo "      • Start: gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:\$PORT"
echo "   👉 Add Environment Variables (see DEPLOYMENT_INSTRUCTIONS.md)"
echo ""
echo "2️⃣  FRONTEND DEPLOYMENT (Vercel):"
echo "   👉 After backend is deployed, copy Render URL"
echo "   👉 Run: npm i -g vercel"
echo "   👉 Run: vercel login"
echo "   👉 Run: vercel --prod"
echo "   👉 Add env vars with backend URL"
echo ""
echo "📖 Full instructions: DEPLOYMENT_INSTRUCTIONS.md"
echo ""

