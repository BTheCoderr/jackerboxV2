#!/usr/bin/env node

/**
 * This script enhances hot reloading in Next.js by:
 * 1. Setting the appropriate environment variables
 * 2. Clearing the Next.js cache
 * 3. Starting the development server with optimized settings
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = process.cwd();

// Clear the Next.js cache
console.log('🧹 Clearing Next.js cache...');
try {
  // Make sure the .next directory exists
  const nextDir = join(__dirname, '.next');
  if (existsSync(nextDir)) {
    execSync('rm -rf .next/cache', { stdio: 'inherit' });
  } else {
    mkdirSync(nextDir, { recursive: true });
  }
  console.log('✅ Cache cleared successfully');
} catch (error) {
  console.error('❌ Failed to clear cache:', error.message);
}

// Set environment variables for better hot reloading
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_FAST_REFRESH = 'true';
process.env.NEXT_TURBO = 'true';

// Start the development server with optimized settings
console.log('🚀 Starting development server with enhanced hot reloading...');
try {
  execSync('next dev', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_FAST_REFRESH: 'true',
      NEXT_TURBO: 'true'
    }
  });
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
} 