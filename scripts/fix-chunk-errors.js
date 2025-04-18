#!/usr/bin/env node

/**
 * Fix Next.js Build Issues Script
 * 
 * This script helps fix common Next.js issues:
 * 1. Chunk load errors
 * 2. CSS loading loops
 * 3. Build cache issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🔧 Starting Next.js fix process...');

try {
  // Step 1: Kill any running Next.js processes
  console.log('👉 Stopping any running Next.js processes...');
  try {
    execSync('npx kill-port 3000 3001 3002');
    console.log('✅ Killed processes on development ports');
  } catch (error) {
    console.log('⚠️ No processes found to kill (this is okay)');
  }

  // Step 2: Clear Next.js cache
  console.log('👉 Clearing Next.js cache...');
  try {
    // Remove .next directory
    if (fs.existsSync(path.join(rootDir, '.next'))) {
      execSync('rm -rf .next', { cwd: rootDir });
      console.log('✅ Removed .next directory');
    } else {
      console.log('ℹ️ No .next directory found');
    }
    
    // Clear Next.js cache
    execSync('npx next telemetry disable', { cwd: rootDir });
    console.log('✅ Disabled Next.js telemetry');
    
    // Remove node_modules/.cache
    if (fs.existsSync(path.join(rootDir, 'node_modules', '.cache'))) {
      execSync('rm -rf node_modules/.cache', { cwd: rootDir });
      console.log('✅ Cleared node_modules/.cache');
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
  }

  // Step 3: Fix tailwind and postcss configuration
  console.log('👉 Checking tailwind and postcss configuration...');
  
  // Ensure tailwind.config.js exists
  const tailwindPath = path.join(rootDir, 'tailwind.config.js');
  if (!fs.existsSync(tailwindPath)) {
    console.log('⚠️ Creating missing tailwind.config.js file');
    fs.writeFileSync(tailwindPath, `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
    },
  },
  plugins: [],
}
`);
  }
  
  // Ensure postcss.config.js exists
  const postcssPath = path.join(rootDir, 'postcss.config.js');
  if (!fs.existsSync(postcssPath)) {
    console.log('⚠️ Creating missing postcss.config.js file');
    fs.writeFileSync(postcssPath, `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: 'default',
          },
        }
      : {})
  },
}
`);
  }

  // Step 4: Check for critical CSS files
  console.log('👉 Verifying CSS files...');
  
  // Check globals.css
  const globalsCssPath = path.join(rootDir, 'src', 'app', 'globals.css');
  if (fs.existsSync(globalsCssPath)) {
    const cssContent = fs.readFileSync(globalsCssPath, 'utf8');
    
    // Check if it includes the necessary tailwind directives
    if (!cssContent.includes('@tailwind') && !cssContent.includes('@import "tailwindcss"')) {
      console.log('⚠️ Fixing missing Tailwind directives in globals.css');
      const updatedCss = `/* Global CSS */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Fix for infinite CSS loading loop */
html {
  visibility: visible;
  opacity: 1;
}

${cssContent}`;
      
      fs.writeFileSync(globalsCssPath, updatedCss);
    }
  } else {
    console.log('⚠️ Creating missing globals.css file');
    fs.mkdirSync(path.join(rootDir, 'src', 'app'), { recursive: true });
    fs.writeFileSync(globalsCssPath, `/* Global CSS */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

body {
  min-height: 100vh;
  background-color: rgb(249, 250, 251);
  font-family: var(--font-sans);
}

/* Fix for infinite CSS loading loop */
html {
  visibility: visible;
  opacity: 1;
}
`);
  }

  // Step 5: Install dependencies if needed
  console.log('👉 Checking for any missing dependencies...');
  try {
    // Check for tailwind and postcss
    const output = execSync('npm ls tailwindcss postcss autoprefixer', { cwd: rootDir, stdio: 'pipe' }).toString();
    if (output.includes('(empty)') || output.includes('missing')) {
      console.log('⚠️ Installing missing CSS processing dependencies...');
      execSync('npm install -D tailwindcss postcss autoprefixer', { cwd: rootDir, stdio: 'inherit' });
    } else {
      console.log('✅ CSS processing dependencies are installed');
    }
    
    // Check core dependencies
    execSync('npm ls react react-dom next', { cwd: rootDir, stdio: 'pipe' });
    console.log('✅ Core dependencies look good');
  } catch (error) {
    console.log('⚠️ Potential dependency issues detected, running npm install...');
    execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  }

  // Step 6: Start the dev server
  console.log('👉 Starting Next.js development server...');
  console.log('✅ All fixes applied! The development server will start now.');
  console.log('\n🚀 Starting Next.js in development mode...');
  
  // Using execSync to wait for the server to exit
  execSync('npm run dev', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Error occurred:', error.message);
  process.exit(1);
}

export default {
  // ... existing code ...
} 