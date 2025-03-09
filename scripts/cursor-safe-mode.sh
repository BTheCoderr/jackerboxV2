#!/bin/bash

# Cursor Safe Mode Launcher
# This script launches Cursor with extensions disabled to reduce CPU usage

echo "🚀 Launching Cursor in Safe Mode (Extensions Disabled)"
echo "===================================================="

# Determine OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CURSOR_PATH="/Applications/Cursor.app/Contents/MacOS/Cursor"
    
    echo "🔄 Terminating any running Cursor instances..."
    pkill -f Cursor || echo "ℹ️ No running Cursor instances found"
    
    # Wait a moment for processes to terminate
    sleep 1
    
    echo "🚀 Launching Cursor with extensions disabled..."
    open "$CURSOR_PATH" --args --disable-extensions --disable-gpu
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CURSOR_PATHS=(
        "/usr/bin/cursor"
        "/usr/local/bin/cursor"
        "/opt/cursor/cursor"
    )
    
    CURSOR_PATH=""
    for path in "${CURSOR_PATHS[@]}"; do
        if [ -f "$path" ]; then
            CURSOR_PATH="$path"
            break
        fi
    done
    
    if [ -z "$CURSOR_PATH" ]; then
        echo "❌ Could not find Cursor executable. Please make sure Cursor is installed."
        exit 1
    fi
    
    echo "🔄 Terminating any running Cursor instances..."
    pkill -f Cursor || echo "ℹ️ No running Cursor instances found"
    
    # Wait a moment for processes to terminate
    sleep 1
    
    echo "🚀 Launching Cursor with extensions disabled..."
    nohup "$CURSOR_PATH" --disable-extensions --disable-gpu > /dev/null 2>&1 &
    
elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]] || [[ "$OSTYPE" == "win32"* ]]; then
    # Windows
    PROGRAM_FILES="${PROGRAMFILES:-C:\\Program Files}"
    PROGRAM_FILES_X86="${PROGRAMFILES(x86):-C:\\Program Files (x86)}"
    USER_PROFILE="${USERPROFILE:-C:\\Users\\$(whoami)}"
    
    CURSOR_PATHS=(
        "$PROGRAM_FILES\\Cursor\\Cursor.exe"
        "$PROGRAM_FILES_X86\\Cursor\\Cursor.exe"
        "$USER_PROFILE\\AppData\\Local\\Programs\\cursor\\Cursor.exe"
    )
    
    CURSOR_PATH=""
    for path in "${CURSOR_PATHS[@]}"; do
        if [ -f "$path" ]; then
            CURSOR_PATH="$path"
            break
        fi
    done
    
    if [ -z "$CURSOR_PATH" ]; then
        echo "❌ Could not find Cursor executable. Please make sure Cursor is installed."
        exit 1
    fi
    
    echo "🔄 Terminating any running Cursor instances..."
    taskkill /F /IM Cursor.exe > /dev/null 2>&1 || echo "ℹ️ No running Cursor instances found"
    
    # Wait a moment for processes to terminate
    sleep 1
    
    echo "🚀 Launching Cursor with extensions disabled..."
    start "" "$CURSOR_PATH" --disable-extensions --disable-gpu
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "✅ Cursor launched in safe mode with extensions disabled"
echo "ℹ️ If Cursor still has high CPU usage, try the following:"
echo "  1. Run the fix-cursor-cpu.js script to optimize settings"
echo "  2. Clear Cursor cache manually"
echo "  3. Consider using VS Code as an alternative if issues persist" 