#!/bin/bash
# Render Build Script — Trust Layer (dwtl.io)
set -e

echo "📦 [Render] Trust Layer build starting..."

# Install ALL deps (devDependencies needed for tsx, vite, etc.)
echo "📚 Installing dependencies..."
NODE_ENV=development npm install --legacy-peer-deps || npm install --force

# Build (tsx script/build.ts — bundles server + client)
echo "🔧 Building application..."
npm run build

echo "✅ [Render] Trust Layer build complete!"
