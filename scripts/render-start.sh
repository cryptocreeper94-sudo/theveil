#!/bin/bash
# Render Start Script — Trust Layer (dwtl.io)
set -e

echo "🚀 [Render] Starting Trust Layer..."

NODE_ENV=production node dist/index.cjs
