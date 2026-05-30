#!/bin/bash
# Render Start Script — Through The Veil
set -e

echo "📖 [Render] Starting Through The Veil..."

NODE_ENV=production node dist/index.cjs
