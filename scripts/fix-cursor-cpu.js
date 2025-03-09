#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { fileURLToPath } from 'url';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Cursor CPU Usage Fix Tool');
console.log('===========================');
console.log('This tool will help diagnose and fix high CPU usage from Cursor.');

// Check if Cursor is running and its CPU usage
function checkCursorProcess() {
  console.log('\n🔍 Checking Cursor processes...');
  
  try {
    let command = '';
    if (os.platform() === 'darwin') {
      command = "ps -eo pcpu,pmem,pid,command | grep -i cursor | grep -v grep";
    } else if (os.platform() === 'linux') {
      command = "ps -eo pcpu,pmem,pid,cmd | grep -i cursor | grep -v grep";
    } else if (os.platform() === 'win32') {
      command = "powershell \"Get-Process | Where-Object {$_.ProcessName -like '*cursor*'} | Format-Table -Property CPU,WorkingSet,Id,ProcessName -AutoSize\"";
    }
    
    if (command) {
      const cursorProcesses = execSync(command).toString();
      if (cursorProcesses) {
        console.log('Found Cursor processes:');
        console.log(cursorProcesses);
        return true;
      } else {
        console.log('No Cursor processes found running.');
        return false;
      }
    } else {
      console.log('Platform not supported for process checking');
      return false;
    }
  } catch (error) {
    console.log('No Cursor processes found running.');
    return false;
  }
}

// Kill Cursor processes
function killCursorProcesses() {
  console.log('\n⚠️ Attempting to terminate Cursor processes...');
  
  try {
    let command = '';
    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      command = "pkill -f cursor";
    } else if (os.platform() === 'win32') {
      command = "powershell \"Get-Process | Where-Object {$_.ProcessName -like '*cursor*'} | Stop-Process -Force\"";
    }
    
    if (command) {
      execSync(command, { stdio: 'ignore' });
      console.log('✅ Cursor processes terminated successfully');
      return true;
    } else {
      console.log('❌ Platform not supported for process termination');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to terminate Cursor processes. You may need to do this manually.');
    return false;
  }
}

// Clear Cursor cache
function clearCursorCache() {
  console.log('\n🧹 Clearing Cursor cache...');
  
  let cachePath = '';
  
  if (os.platform() === 'darwin') {
    cachePath = path.join(os.homedir(), 'Library/Application Support/Cursor');
  } else if (os.platform() === 'linux') {
    cachePath = path.join(os.homedir(), '.config/Cursor');
  } else if (os.platform() === 'win32') {
    cachePath = path.join(os.homedir(), 'AppData/Roaming/Cursor');
  }
  
  if (!cachePath || !fs.existsSync(cachePath)) {
    console.log('❌ Cursor cache directory not found');
    return false;
  }
  
  try {
    // Don't delete the entire directory, just clear specific cache folders
    const cacheDirectories = [
      'Code Cache',
      'GPUCache',
      'Cache',
      'CachedData',
      'CachedExtensions',
      'CachedExtensionVSIXs'
    ];
    
    let cleared = false;
    
    for (const dir of cacheDirectories) {
      const dirPath = path.join(cachePath, dir);
      if (fs.existsSync(dirPath)) {
        try {
          if (os.platform() === 'win32') {
            execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore' });
          } else {
            execSync(`rm -rf "${dirPath}"`, { stdio: 'ignore' });
          }
          console.log(`✅ Cleared: ${dir}`);
          cleared = true;
        } catch (err) {
          console.log(`❌ Failed to clear: ${dir}`);
        }
      }
    }
    
    if (cleared) {
      console.log('✅ Cursor cache cleared successfully');
      return true;
    } else {
      console.log('❌ No cache directories found to clear');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to clear Cursor cache:', error.message);
    return false;
  }
}

// Reset Cursor settings
function resetCursorSettings() {
  console.log('\n⚙️ Resetting Cursor settings...');
  
  let settingsPath = '';
  
  if (os.platform() === 'darwin') {
    settingsPath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/settings.json');
  } else if (os.platform() === 'linux') {
    settingsPath = path.join(os.homedir(), '.config/Cursor/User/settings.json');
  } else if (os.platform() === 'win32') {
    settingsPath = path.join(os.homedir(), 'AppData/Roaming/Cursor/User/settings.json');
  }
  
  if (!settingsPath || !fs.existsSync(settingsPath)) {
    console.log('❌ Cursor settings file not found');
    return false;
  }
  
  try {
    // Backup the original settings
    const backupPath = `${settingsPath}.backup`;
    fs.copyFileSync(settingsPath, backupPath);
    console.log(`✅ Settings backed up to: ${backupPath}`);
    
    // Read the settings
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    
    // Modify settings that might cause high CPU usage
    const optimizedSettings = {
      ...settings,
      "editor.cursorSmoothCaretAnimation": false,
      "editor.renderWhitespace": "none",
      "editor.minimap.enabled": false,
      "editor.renderControlCharacters": false,
      "editor.renderLineHighlight": "none",
      "editor.guides.indentation": false,
      "editor.bracketPairColorization.enabled": false,
      "workbench.list.smoothScrolling": false,
      "window.autoDetectColorScheme": false,
      "telemetry.telemetryLevel": "off",
      "update.mode": "manual",
      "extensions.autoUpdate": false,
      "cursor.intellisense.enableInlineCompletion": false,
      "cursor.intellisense.enableInlineCompletionSuggestions": false,
      "cursor.intellisense.enableInlineCompletionSuggestionsUI": false
    };
    
    // Write the optimized settings
    fs.writeFileSync(settingsPath, JSON.stringify(optimizedSettings, null, 2));
    console.log('✅ Cursor settings optimized for lower CPU usage');
    return true;
  } catch (error) {
    console.log('❌ Failed to reset Cursor settings:', error.message);
    return false;
  }
}

// Disable Cursor extensions
function disableCursorExtensions() {
  console.log('\n🧩 Checking for problematic Cursor extensions...');
  
  let extensionsPath = '';
  
  if (os.platform() === 'darwin') {
    extensionsPath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/extensions');
  } else if (os.platform() === 'linux') {
    extensionsPath = path.join(os.homedir(), '.config/Cursor/User/extensions');
  } else if (os.platform() === 'win32') {
    extensionsPath = path.join(os.homedir(), 'AppData/Roaming/Cursor/User/extensions');
  }
  
  if (!extensionsPath || !fs.existsSync(extensionsPath)) {
    console.log('❌ Cursor extensions directory not found');
    return false;
  }
  
  try {
    // Create a disabled directory if it doesn't exist
    const disabledPath = path.join(extensionsPath, '../disabled-extensions');
    if (!fs.existsSync(disabledPath)) {
      fs.mkdirSync(disabledPath, { recursive: true });
    }
    
    // Get a list of extensions
    const extensions = fs.readdirSync(extensionsPath);
    
    // Known problematic extensions that might cause high CPU usage
    const problematicExtensions = [
      'github.copilot',
      'github.copilot-chat',
      'tabnine.tabnine-vscode',
      'visualstudioexptteam.vscodeintellicode',
      'ms-python.python',
      'ms-toolsai.jupyter'
    ];
    
    let disabledCount = 0;
    
    for (const ext of extensions) {
      if (problematicExtensions.some(pe => ext.startsWith(pe))) {
        const sourcePath = path.join(extensionsPath, ext);
        const targetPath = path.join(disabledPath, ext);
        
        try {
          // Move the extension to the disabled directory
          fs.renameSync(sourcePath, targetPath);
          console.log(`✅ Disabled extension: ${ext}`);
          disabledCount++;
        } catch (err) {
          console.log(`❌ Failed to disable extension: ${ext}`);
        }
      }
    }
    
    if (disabledCount > 0) {
      console.log(`✅ Disabled ${disabledCount} problematic extensions`);
      return true;
    } else {
      console.log('ℹ️ No problematic extensions found to disable');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to disable Cursor extensions:', error.message);
    return false;
  }
}

// Run the fix
async function runFix() {
  const cursorRunning = checkCursorProcess();
  
  if (cursorRunning) {
    const answer = await new Promise(resolve => {
      rl.question('\n⚠️ Cursor is currently running. Do you want to terminate it? (y/n): ', resolve);
    });
    
    if (answer.toLowerCase() === 'y') {
      killCursorProcesses();
    } else {
      console.log('⚠️ Please close Cursor manually before continuing.');
      const proceed = await new Promise(resolve => {
        rl.question('Have you closed Cursor? (y/n): ', resolve);
      });
      
      if (proceed.toLowerCase() !== 'y') {
        console.log('❌ Aborting fix. Please close Cursor and try again.');
        rl.close();
        return;
      }
    }
  }
  
  const clearCache = await new Promise(resolve => {
    rl.question('\nDo you want to clear Cursor cache? (y/n): ', resolve);
  });
  
  if (clearCache.toLowerCase() === 'y') {
    clearCursorCache();
  }
  
  const resetSettings = await new Promise(resolve => {
    rl.question('\nDo you want to optimize Cursor settings for lower CPU usage? (y/n): ', resolve);
  });
  
  if (resetSettings.toLowerCase() === 'y') {
    resetCursorSettings();
  }
  
  const disableExtensions = await new Promise(resolve => {
    rl.question('\nDo you want to disable problematic Cursor extensions? (y/n): ', resolve);
  });
  
  if (disableExtensions.toLowerCase() === 'y') {
    disableCursorExtensions();
  }
  
  console.log('\n✅ Fix process completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Restart your computer to ensure all changes take effect');
  console.log('2. When you start Cursor again, monitor its CPU usage in Activity Monitor');
  console.log('3. If issues persist, consider using VS Code instead of Cursor temporarily');
  console.log('4. Make sure your macOS is up to date');
  
  rl.close();
}

runFix(); 