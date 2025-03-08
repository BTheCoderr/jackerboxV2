#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧹 Cleaning up Next.js cache...');

// Clean up Next.js cache
const nextCacheDir = path.join(rootDir, '.next/cache');
if (fs.existsSync(nextCacheDir)) {
  try {
    execSync(`rm -rf ${nextCacheDir}`);
    console.log('✅ Next.js cache cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning Next.js cache:', error.message);
  }
}

// Kill any running Next.js dev server
console.log('🔄 Stopping any running Next.js dev server...');
try {
  execSync('pkill -f "node.*next dev"', { stdio: 'ignore' });
  console.log('✅ Stopped running Next.js dev server');
} catch (error) {
  // It's okay if no process was found to kill
  console.log('ℹ️ No running Next.js dev server found');
}

// Restart the dev server
console.log('🚀 Starting Next.js dev server with clean cache...');
try {
  // Set environment variables to improve hot reloading
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NEXT_FAST_REFRESH = 'true';
  process.env.NEXT_TURBO = 'true';
  
  // Start the dev server in a new process so this script can exit
  const child = execSync('npm run dev', { 
    cwd: rootDir,
    stdio: 'inherit'
  });
  
  console.log('✅ Next.js dev server started successfully');
} catch (error) {
  console.error('❌ Error starting Next.js dev server:', error.message);
  process.exit(1);
} 