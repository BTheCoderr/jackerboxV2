#!/usr/bin/env bash
set -euo pipefail

# The standard Next.js build is responsive; do not overwrite active config or change lockfiles.
echo "Starting JackerBox responsive web app with the canonical Next.js config..."
npm run build
npm start
