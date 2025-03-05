#!/usr/bin/env node

/**
 * This script fixes the vercel.json file by removing any secrets
 * and ensuring it only contains configuration settings.
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing vercel.json to remove any secrets...');

const rootDir = process.cwd();
const vercelJsonPath = path.join(rootDir, 'vercel.json');

// Check if vercel.json exists
if (!fs.existsSync(vercelJsonPath)) {
  console.log('❌ vercel.json not found. Creating a new one...');
}

// Create a clean vercel.json with only configuration settings
const cleanVercelConfig = {
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

// Write the clean config to vercel.json
fs.writeFileSync(vercelJsonPath, JSON.stringify(cleanVercelConfig, null, 2));
console.log('✅ vercel.json has been fixed and cleaned of any secrets.');

// Remind about environment variables
console.log('\n⚠️ Remember: All secrets should be set as environment variables in Vercel.');
console.log('   Do not commit any API keys, tokens, or passwords to your repository.');
console.log('   Instead, set them in the Vercel dashboard under Environment Variables.');

// Check if there are any changes to commit
try {
  const gitStatus = require('child_process').execSync('git status --porcelain').toString();
  if (gitStatus.includes('vercel.json')) {
    console.log('\n📝 Changes detected in vercel.json. You should commit these changes:');
    console.log('   git add vercel.json');
    console.log('   git commit -m "Remove secrets from vercel.json"');
  }
} catch (error) {
  console.log('\n⚠️ Could not check git status. Please commit any changes manually.');
}

console.log('\n🎉 Done! Your vercel.json file is now clean and ready for deployment.'); 