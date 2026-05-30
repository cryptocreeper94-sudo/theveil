#!/bin/bash
# Render Build — Through The Veil (static site)
set -e
echo "✓ [Render] TheVeil — building static site..."

# Create dist directory with index.html
mkdir -p dist
cp index.html dist/index.html
cp server.cjs dist/index.cjs

# Copy public assets if they exist
if [ -d "public" ]; then
  cp -r public/* dist/ 2>/dev/null || true
fi

echo "✓ [Render] Build complete — dist/ ready"
