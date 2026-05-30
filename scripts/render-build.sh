#!/bin/bash
# Render Build — Through The Veil
set -e
echo "🌫️ [Render] TheVeil — checking files..."
test -f server.cjs && echo "  ✅ server.cjs" || echo "  ❌ server.cjs MISSING"
test -f index.html && echo "  ✅ index.html" || echo "  ❌ index.html MISSING"
test -f reader.html && echo "  ✅ reader.html" || echo "  ❌ reader.html MISSING"
test -f public/through-the-veil.md && echo "  ✅ book markdown" || echo "  ❌ book MISSING"
test -f public/assets/Through-The-Veil-EBOOK.pdf && echo "  ✅ PDF" || echo "  ❌ PDF MISSING"
echo "🌫️ [Render] Build complete"
