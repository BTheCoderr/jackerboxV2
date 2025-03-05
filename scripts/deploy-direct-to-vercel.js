#!/usr/bin/env node

/**
 * This script deploys directly to Vercel and sets up environment variables
 * from local .env files without pushing them to GitHub.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

console.log('🚀 Starting direct deployment to Vercel...');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.log('❌ Vercel CLI is not installed. Installing now...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed successfully.');
  } catch (installError) {
    console.error('❌ Failed to install Vercel CLI:', installError.message);
    console.log('Please install Vercel CLI manually: npm install -g vercel');
    process.exit(1);
  }
}

// Determine the root directory
const rootDir = process.cwd();

// Load environment variables from .env files
console.log('📝 Loading environment variables from .env files...');
const envFiles = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local'
];

let envVars = {};

envFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`Found ${file}`);
    const envConfig = dotenv.parse(fs.readFileSync(filePath));
    envVars = { ...envVars, ...envConfig };
  }
});

// Create a temporary .vercel.env file with all environment variables
console.log('📝 Creating temporary environment file for Vercel...');
const vercelEnvPath = path.join(rootDir, '.vercel.env');
let vercelEnvContent = '';

Object.entries(envVars).forEach(([key, value]) => {
  // Skip empty values and comments
  if (value && !key.startsWith('#')) {
    vercelEnvContent += `${key}=${value}\n`;
  }
});

fs.writeFileSync(vercelEnvPath, vercelEnvContent);
console.log('✅ Temporary environment file created.');

// Run the Vercel preparation script
console.log('🔧 Running Vercel preparation script...');
try {
  execSync('node scripts/prepare-for-vercel.js', { stdio: 'inherit' });
  console.log('✅ Vercel preparation completed.');
} catch (error) {
  console.error('❌ Failed to run Vercel preparation script:', error.message);
  // Continue anyway
}

// Run the fix-vercel-secrets script to ensure vercel.json is clean
console.log('🔧 Ensuring vercel.json is clean of secrets...');
try {
  execSync('node scripts/fix-vercel-secrets.js', { stdio: 'inherit' });
  console.log('✅ vercel.json cleaned of secrets.');
} catch (error) {
  console.error('❌ Failed to clean vercel.json:', error.message);
  // Continue anyway
}

// Deploy to Vercel with environment variables
console.log('🚀 Deploying to Vercel...');
console.log('⚠️ You will be prompted to log in if not already logged in.');
console.log('⚠️ When asked about environment variables, choose to import from .vercel.env');

try {
  // Deploy with environment variables from the temporary file
  execSync('vercel --env-file .vercel.env', { stdio: 'inherit' });
  console.log('✅ Deployment initiated!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('Please try deploying manually: vercel --env-file .vercel.env');
}

// Clean up the temporary environment file
console.log('🧹 Cleaning up temporary files...');
try {
  fs.unlinkSync(vercelEnvPath);
  console.log('✅ Temporary environment file removed.');
} catch (error) {
  console.error('❌ Failed to remove temporary file:', error.message);
  console.log(`Please remove it manually: rm ${vercelEnvPath}`);
}

console.log('\n🎉 Deployment process completed!');
console.log('\nNext steps:');
console.log('1. Verify your deployment in the Vercel dashboard');
console.log('2. Check that all environment variables were correctly set');
console.log('3. Test your application functionality');
console.log('4. Set up a custom domain if needed'); 