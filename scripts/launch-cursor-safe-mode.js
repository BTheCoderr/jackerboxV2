#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

console.log('🚀 Launching Cursor in Safe Mode (Extensions Disabled)');
console.log('====================================================');

// Determine the Cursor executable path based on the platform
function getCursorPath() {
  if (os.platform() === 'darwin') {
    return '/Applications/Cursor.app/Contents/MacOS/Cursor';
  } else if (os.platform() === 'win32') {
    // Check common installation paths on Windows
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    
    const possiblePaths = [
      path.join(programFiles, 'Cursor', 'Cursor.exe'),
      path.join(programFilesX86, 'Cursor', 'Cursor.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'cursor', 'Cursor.exe')
    ];
    
    for (const cursorPath of possiblePaths) {
      if (fs.existsSync(cursorPath)) {
        return cursorPath;
      }
    }
    
    console.error('❌ Could not find Cursor installation on Windows');
    return null;
  } else if (os.platform() === 'linux') {
    // Check common installation paths on Linux
    const possiblePaths = [
      '/usr/bin/cursor',
      '/usr/local/bin/cursor',
      '/opt/cursor/cursor'
    ];
    
    for (const cursorPath of possiblePaths) {
      if (fs.existsSync(cursorPath)) {
        return cursorPath;
      }
    }
    
    console.error('❌ Could not find Cursor installation on Linux');
    return null;
  }
  
  console.error('❌ Unsupported platform');
  return null;
}

// Kill any running Cursor instances
function killCursorProcesses() {
  console.log('🔄 Terminating any running Cursor instances...');
  
  try {
    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      execSync('pkill -f Cursor', { stdio: 'ignore' });
    } else if (os.platform() === 'win32') {
      execSync('taskkill /F /IM Cursor.exe', { stdio: 'ignore' });
    }
    console.log('✅ Terminated running Cursor instances');
  } catch (error) {
    // It's okay if there are no Cursor processes to kill
    console.log('ℹ️ No running Cursor instances found');
  }
}

// Launch Cursor with extensions disabled
function launchCursorSafeMode() {
  const cursorPath = getCursorPath();
  
  if (!cursorPath) {
    console.error('❌ Could not find Cursor executable. Please make sure Cursor is installed.');
    return;
  }
  
  console.log('🚀 Launching Cursor with extensions disabled...');
  
  try {
    // Different launch commands based on platform
    if (os.platform() === 'darwin') {
      // On macOS, we can use the open command with arguments
      execSync(`open "${cursorPath}" --args --disable-extensions --disable-gpu`, { 
        stdio: 'ignore',
        detached: true 
      });
    } else if (os.platform() === 'win32') {
      // On Windows, launch directly with arguments
      execSync(`"${cursorPath}" --disable-extensions --disable-gpu`, { 
        stdio: 'ignore',
        detached: true,
        windowsHide: true
      });
    } else if (os.platform() === 'linux') {
      // On Linux, launch directly with arguments
      execSync(`"${cursorPath}" --disable-extensions --disable-gpu`, { 
        stdio: 'ignore',
        detached: true 
      });
    }
    
    console.log('✅ Cursor launched in safe mode with extensions disabled');
    console.log('ℹ️ If Cursor still has high CPU usage, try the following:');
    console.log('  1. Run the fix-cursor-cpu.js script to optimize settings');
    console.log('  2. Clear Cursor cache manually');
    console.log('  3. Consider using VS Code as an alternative if issues persist');
  } catch (error) {
    console.error('❌ Failed to launch Cursor:', error.message);
  }
}

// Main function
async function main() {
  // First kill any running instances
  killCursorProcesses();
  
  // Wait a moment for processes to terminate
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Launch Cursor in safe mode
  launchCursorSafeMode();
}

main(); 