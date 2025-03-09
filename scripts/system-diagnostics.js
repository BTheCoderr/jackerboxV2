#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

console.log('🔍 Running System Diagnostics...');
console.log('===============================');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentDir = path.resolve(__dirname, '..');

// Get system information
function getSystemInfo() {
  console.log('\n📊 System Information:');
  console.log('---------------------');
  
  // OS Info
  console.log(`OS: ${os.type()} ${os.release()}`);
  console.log(`Platform: ${os.platform()}`);
  console.log(`Architecture: ${os.arch()}`);
  
  // CPU Info
  const cpuInfo = os.cpus();
  console.log(`CPU: ${cpuInfo[0].model}`);
  console.log(`CPU Cores: ${cpuInfo.length}`);
  
  // Memory Info
  const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100;
  const freeMemory = Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100;
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);
  
  console.log(`Total Memory: ${totalMemory} GB`);
  console.log(`Free Memory: ${freeMemory} GB`);
  console.log(`Used Memory: ${usedMemory} GB (${memoryUsagePercent}%)`);
  
  // Uptime
  const uptime = Math.round(os.uptime() / 3600);
  console.log(`System Uptime: ${uptime} hours`);
}

// Get disk usage
function getDiskUsage() {
  console.log('\n💾 Disk Usage:');
  console.log('-------------');
  
  try {
    const diskInfo = execSync('df -h /').toString();
    console.log(diskInfo);
  } catch (error) {
    console.error('Error getting disk usage:', error.message);
  }
}

// Get top CPU and memory processes
function getTopProcesses() {
  console.log('\n🔥 Top CPU Processes:');
  console.log('-------------------');
  
  try {
    // Different commands for different platforms
    let command = '';
    if (os.platform() === 'darwin') {
      command = "ps -eo pcpu,pmem,pid,command | sort -k 1 -r | head -10";
    } else if (os.platform() === 'linux') {
      command = "ps -eo pcpu,pmem,pid,cmd | sort -k 1 -r | head -10";
    } else if (os.platform() === 'win32') {
      command = "powershell \"Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 | Format-Table -Property CPU,WorkingSet,Id,ProcessName -AutoSize\"";
    }
    
    if (command) {
      const processes = execSync(command).toString();
      console.log(processes);
    } else {
      console.log('Platform not supported for process listing');
    }
  } catch (error) {
    console.error('Error getting top processes:', error.message);
  }
}

// Check for large files in the project
function findLargeFiles(directory, threshold = 50 * 1024 * 1024) { // Default 50MB
  console.log('\n📁 Large Files in Project:');
  console.log('------------------------');
  
  try {
    // Skip node_modules, .git, and other common large directories
    const excludeDirs = ['.git', 'node_modules', '.next', 'build', 'dist'];
    
    let largeFiles = [];
    
    function scanDirectory(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        
        // Skip excluded directories
        if (excludeDirs.includes(file) && fs.statSync(filePath).isDirectory()) {
          continue;
        }
        
        try {
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            scanDirectory(filePath);
          } else if (stats.size > threshold) {
            largeFiles.push({
              path: filePath,
              size: stats.size
            });
          }
        } catch (err) {
          // Skip files we can't access
        }
      }
    }
    
    scanDirectory(directory);
    
    // Sort by size (largest first)
    largeFiles.sort((a, b) => b.size - a.size);
    
    if (largeFiles.length === 0) {
      console.log('No large files found (over 50MB)');
    } else {
      console.log('Found the following large files:');
      largeFiles.forEach(file => {
        const sizeMB = Math.round(file.size / (1024 * 1024) * 100) / 100;
        console.log(`${file.path} (${sizeMB} MB)`);
      });
    }
  } catch (error) {
    console.error('Error scanning for large files:', error.message);
  }
}

// Check for memory leaks in Node.js processes
function checkNodeProcesses() {
  console.log('\n🔄 Node.js Processes:');
  console.log('-------------------');
  
  try {
    let command = '';
    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      command = "ps -eo pmem,pid,command | grep node | grep -v grep";
    } else if (os.platform() === 'win32') {
      command = "powershell \"Get-Process -Name node | Format-Table -Property WorkingSet,Id,Path -AutoSize\"";
    }
    
    if (command) {
      const nodeProcesses = execSync(command).toString();
      console.log(nodeProcesses || 'No Node.js processes found');
    } else {
      console.log('Platform not supported for Node.js process listing');
    }
  } catch (error) {
    console.log('No Node.js processes found or error getting processes');
  }
}

// Optimize system resources
function optimizeSystem() {
  console.log('\n🧹 Optimizing System Resources:');
  console.log('-----------------------------');
  
  try {
    // Clear system caches (macOS only)
    if (os.platform() === 'darwin') {
      console.log('Clearing system caches...');
      try {
        execSync('sudo purge', { stdio: 'ignore' });
        console.log('✅ System caches cleared');
      } catch (error) {
        console.log('⚠️ Could not clear system caches (requires sudo)');
      }
    }
    
    // Clear npm cache
    console.log('Clearing npm cache...');
    execSync('npm cache clean --force', { stdio: 'ignore' });
    console.log('✅ npm cache cleared');
    
    // Clear Next.js cache if it exists
    if (fs.existsSync(path.join(currentDir, '.next'))) {
      console.log('Clearing Next.js build cache...');
      try {
        execSync('rm -rf .next', { stdio: 'ignore' });
        console.log('✅ Next.js cache cleared');
      } catch (error) {
        console.log('⚠️ Could not clear Next.js cache');
      }
    }
    
    // Suggest killing resource-intensive processes
    console.log('\n⚠️ Consider terminating resource-intensive processes:');
    console.log('Run: kill -9 [PID] to terminate a specific process');
    console.log('Or use Activity Monitor (macOS) to force quit applications');
  } catch (error) {
    console.error('Error optimizing system:', error.message);
  }
}

// Suggest next steps
function suggestNextSteps() {
  console.log('\n🔧 Recommended Next Steps:');
  console.log('------------------------');
  console.log('1. Restart your computer to clear memory and reset processes');
  console.log('2. Check for macOS updates that might fix performance issues');
  console.log('3. Use Activity Monitor to identify and quit resource-intensive apps');
  console.log('4. Consider running "npm prune" to remove unused dependencies');
  console.log('5. Run "npm dedupe" to remove duplicate dependencies');
  console.log('6. If using VS Code or Cursor, try disabling extensions one by one');
  console.log('7. Check for large media files in your project and consider optimizing them');
  console.log('8. Consider increasing your swap file size if memory is consistently full');
}

// Run all diagnostics
function runDiagnostics() {
  console.log(`Running diagnostics in: ${currentDir}`);
  
  getSystemInfo();
  getDiskUsage();
  getTopProcesses();
  findLargeFiles(currentDir);
  checkNodeProcesses();
  optimizeSystem();
  suggestNextSteps();
  
  console.log('\n✅ Diagnostics complete!');
}

runDiagnostics(); 