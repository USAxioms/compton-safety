#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "COMPTON-CLASS SAFETY FRAMEWORK v1.0.0"
echo "CodeOcean Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Go to /code
cd /code

echo "🔧 Renaming configuration files..."
[ -f package-compton.json ] && mv package-compton.json package.json
[ -f tsconfig-compton.json ] && mv tsconfig-compton.json tsconfig.json
echo ""

echo "📋 Checking environment..."
node --version
npm --version
echo ""

echo "📦 Installing dependencies..."
npm install
echo ""

echo "🔨 Building TypeScript..."
npm run build
echo ""

echo "✅ Running test suite..."
npm test
echo ""

echo "🚀 Starting demonstration..."
npm start
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ COMPTON FRAMEWORK DEPLOYMENT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
