#!/bin/bash

# Script to launch Cursor with extensions disabled
# This helps reduce CPU usage by preventing resource-intensive extensions from loading

echo "🚀 Launching Cursor with extensions disabled..."

# Kill any existing Cursor processes
echo "Closing any existing Cursor instances..."
pkill -f "Cursor" || true
sleep 2

# Launch Cursor with the --disable-extensions flag
echo "Starting Cursor in safe mode..."
open -a "Cursor" --args --disable-extensions

echo "✅ Cursor launched with extensions disabled"
echo "If CPU usage is still high, try running the fix-cursor-cpu.js script for more comprehensive fixes." 