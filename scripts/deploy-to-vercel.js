#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Vercel deployment process...');

// Function to run a command and log output
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
  console.log('✅ Vercel CLI is installed');
} catch (error) {
  console.log('⚠️ Vercel CLI is not installed. Installing now...');
  if (!runCommand('npm install -g vercel')) {
    console.error('❌ Failed to install Vercel CLI. Please install it manually with "npm install -g vercel"');
    process.exit(1);
  }
}

// Create a vercel.json file if it doesn't exist
if (!fs.existsSync('vercel.json')) {
  console.log('📝 Creating vercel.json file...');
  const vercelConfig = {
    "buildCommand": "npm run build",
    "devCommand": "npm run dev",
    "installCommand": "npm install",
    "framework": "nextjs",
    "regions": ["sfo1"],
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      },
      {
        "source": "/api/(.*)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-store, max-age=0"
          }
        ]
      },
      {
        "source": "/_next/static/(.*)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  };

  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
}

// Deploy to Vercel
console.log('🚀 Deploying to Vercel...');
if (runCommand('vercel --prod')) {
  console.log('✅ Deployment successful!');
} else {
  console.error('❌ Deployment failed. Please check the errors above.');
  process.exit(1);
}

console.log('🎉 Vercel deployment completed!'); 