#!/bin/bash

echo "🧹 Starting Cursor IDE cleanup..."

# Kill Cursor processes
echo "Stopping Cursor processes..."
pkill -f Cursor

# Clear Extension Cache
echo "Clearing extension cache..."
rm -rf ~/Library/Application\ Support/Cursor/CachedExtensions/*
rm -rf ~/Library/Application\ Support/Cursor/CachedExtensionVSIXs/*

# Clear Workspace Storage
echo "Clearing workspace storage..."
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*

# Clear User Data Cache
echo "Clearing user data cache..."
rm -rf ~/Library/Application\ Support/Cursor/User/History/*
rm -rf ~/Library/Application\ Support/Cursor/Cache/*
rm -rf ~/Library/Application\ Support/Cursor/Code\ Cache/*
rm -rf ~/Library/Application\ Support/Cursor/Crashpad/*

# Clear Editor Cache
echo "Clearing editor cache..."
rm -rf ~/Library/Application\ Support/Cursor/User/snippets/*
rm -rf ~/Library/Application\ Support/Cursor/User/globalStorage/*

# Clear Extension Host Cache
echo "Clearing extension host cache..."
rm -rf ~/Library/Application\ Support/Cursor/exthost\ Crash\ Reports/*
rm -rf ~/Library/Application\ Support/Cursor/logs/*

# Clear Node Modules (if you're an extension developer)
echo "Clearing extension development cache..."
rm -rf ~/Library/Application\ Support/Cursor/User/globalStorage/node_modules/*

echo "✨ Cleanup complete!"
echo "⚠️ Recommendation: Consider installing a stable version of Cursor and disabling auto-updates"
echo "To restart Cursor, run: open -a Cursor" 