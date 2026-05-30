#!/bin/bash
# Render Build — Through The Veil (static site + reader)
set -e
echo "✓ [Render] TheVeil — building static site..."

# Create dist directory
mkdir -p dist

# Copy core files
cp index.html dist/index.html
cp reader.html dist/reader.html
cp server.cjs dist/index.cjs

# Copy public assets (includes book markdown, PDF, EPUB, images)
if [ -d "public" ]; then
  cp -r public dist/public 2>/dev/null || true
fi

# Copy the complete HTML book
if [ -f "Through-The-Veil-COMPLETE.html" ]; then
  cp Through-The-Veil-COMPLETE.html dist/public/Through-The-Veil-COMPLETE.html 2>/dev/null || true
fi

# Also pull from client/public if public dir is missing the book
if [ -d "client/public" ]; then
  mkdir -p dist/client/public
  cp -r client/public/* dist/client/public/ 2>/dev/null || true
fi

echo "✓ [Render] Build complete — dist/ ready"
ls -la dist/
