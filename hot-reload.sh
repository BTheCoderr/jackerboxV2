#!/bin/bash

# This script enhances hot reloading in Next.js

# Clear the Next.js cache
echo "🧹 Clearing Next.js cache..."
if [ -d ".next" ]; then
  rm -rf .next/cache
else
  mkdir -p .next
fi
echo "✅ Cache cleared successfully"

# Set environment variables for better hot reloading
export NEXT_TELEMETRY_DISABLED=1
export NEXT_FAST_REFRESH=true
export NEXT_TURBO=true

# Start the development server with optimized settings
echo "🚀 Starting development server with enhanced hot reloading..."
npx next dev 