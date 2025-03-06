import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting serverless deployment process...');

// Install the Netlify Next.js plugin if not already installed
try {
  console.log('📦 Installing Netlify Next.js plugin...');
  execSync('npm install -D @netlify/plugin-nextjs', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error installing Netlify Next.js plugin:', error.message);
  process.exit(1);
}

// Check if netlify-cli is installed
try {
  execSync('netlify --version', { stdio: 'pipe' });
  console.log('✅ Netlify CLI is already installed');
} catch (error) {
  console.log('📦 Installing Netlify CLI...');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
  } catch (installError) {
    console.error('❌ Error installing Netlify CLI:', installError.message);
    process.exit(1);
  }
}

// Build the application
console.log('📦 Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Deploy to Netlify
console.log('🚀 Deploying to Netlify...');
try {
  execSync('netlify deploy --prod', { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('🔍 Check the error message above for details.');
  process.exit(1);
}

console.log('🎉 Serverless deployment completed!');
console.log('📝 Note: Your API routes should now be functional as serverless functions.');
console.log('📝 You can access your site at https://jackerbox.netlify.app');
console.log('📝 You can manage your site settings at https://app.netlify.com/sites/jackerbox'); 