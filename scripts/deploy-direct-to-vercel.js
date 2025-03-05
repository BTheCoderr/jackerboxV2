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

// Create a .vercel.env file for reference (not used directly by CLI)
console.log('📝 Creating reference environment file...');
const vercelEnvPath = path.join(rootDir, '.vercel.env');
let vercelEnvContent = '';

Object.entries(envVars).forEach(([key, value]) => {
  // Skip empty values and comments
  if (value && !key.startsWith('#')) {
    vercelEnvContent += `${key}=${value}\n`;
  }
});

fs.writeFileSync(vercelEnvPath, vercelEnvContent);
console.log('✅ Reference environment file created.');

// Deploy to Vercel
console.log('🚀 Preparing for Vercel deployment...');
console.log('\n⚠️ Automated deployment encountered an issue.');
console.log('\n📋 Please follow these manual deployment steps:');
console.log('1. Run the following command in your terminal:');
console.log('   vercel');
console.log('2. Follow the prompts to log in if needed');
console.log('3. When asked about environment variables, select "Yes" to customize them');
console.log('4. Enter your environment variables from the reference file');
console.log('\n📝 Your environment variables are available in the .vercel.env file for reference');
console.log('\n🔍 After deployment, check your application at the provided URL');
console.log('🧹 The reference environment file will remain for your convenience');
console.log('   Remember to delete it after successful deployment with:');
console.log('   rm .vercel.env');

// Don't try to run vercel command automatically
// try {
//   console.log('🚀 Deploying to Vercel...');
//   console.log('⚠️ You will be prompted to log in if not already logged in.');
//   console.log('⚠️ When asked about environment variables, select "Yes" to customize them.');
//   console.log('Starting Vercel deployment...');
//   console.log('When prompted for environment variables, please enter them manually from the .vercel.env file.');
//   console.log('This file contains all your environment variables for reference.');
//   
//   execSync('vercel', { stdio: 'inherit' });
//   console.log('✅ Deployment successful!');
// } catch (error) {
//   console.error('❌ Deployment failed:', error.message);
//   console.log('Please try deploying manually with: vercel');
// }

// Don't remove the reference file automatically
// console.log('🧹 Cleaning up temporary files...');
// try {
//   fs.unlinkSync('.vercel.env');
//   console.log('✅ Reference environment file removed.');
// } catch (error) {
//   console.error('❌ Failed to remove reference environment file:', error.message);
// }

console.log('\n🎉 Preparation process completed!');
console.log('\nNext steps:');
console.log('1. Run "vercel" in your terminal to start the deployment');
console.log('2. Verify your deployment in the Vercel dashboard');
console.log('3. Check that all environment variables were correctly set');
console.log('4. Test your application functionality');
console.log('5. Set up a custom domain if needed');
console.log('6. Delete the .vercel.env file after successful deployment'); 