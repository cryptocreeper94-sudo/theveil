#!/bin/bash
# Render Build — Through The Veil (simple static site + server)
set -e
echo "🌫️ [Render] TheVeil — installing dependencies..."

# No build step needed — server.cjs is the server, index.html is the landing page
# Just verify critical files exist
echo "📋 Checking required files..."
test -f server.cjs && echo "  ✅ server.cjs" || echo "  ❌ server.cjs MISSING"
test -f index.html && echo "  ✅ index.html" || echo "  ❌ index.html MISSING"
test -f reader.html && echo "  ✅ reader.html" || echo "  ❌ reader.html MISSING"
test -f public/through-the-veil.md && echo "  ✅ book markdown" || echo "  ❌ book markdown MISSING"
test -f public/assets/Through-The-Veil-EBOOK.pdf && echo "  ✅ PDF ($(du -h public/assets/Through-The-Veil-EBOOK.pdf | cut -f1))" || echo "  ❌ PDF MISSING"
test -f public/assets/Through-The-Veil-EBOOK.epub && echo "  ✅ EPUB" || echo "  ❌ EPUB MISSING"

echo "🌫️ [Render] Build complete — ready to serve"
