#!/bin/bash

# Development server management script
echo "🚀 Starting Smart Research Tracker development server..."

# Kill any existing Vite processes
echo "🔄 Cleaning up existing processes..."
pkill -f "vite" 2>/dev/null || true
sleep 2

# Start the development server
echo "📡 Starting server on http://localhost:5174..."
pnpm dev
