#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🚀 Starting GitHub push and Vercel deployment process...');
  
  // Check if Git is installed
  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Git is not installed. Please install Git and try again.');
    process.exit(1);
  }
  
  // Check if we're in a Git repository
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (error) {
    console.log('📦 Not in a Git repository. Initializing Git repository...');
    try {
      execSync('git init', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to initialize Git repository:', error.message);
      process.exit(1);
    }
  }
  
  // Check if Vercel CLI is installed
  let vercelInstalled = false;
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    vercelInstalled = true;
  } catch (error) {
    console.log('⚠️ Vercel CLI is not installed. We will skip Vercel deployment steps.');
  }
  
  // Run the clean secrets script if it exists
  if (fs.existsSync(path.join(process.cwd(), 'scripts', 'clean-secrets.js'))) {
    console.log('🔍 Checking for secrets in the codebase...');
    try {
      execSync('node scripts/clean-secrets.js', { stdio: 'inherit' });
    } catch (error) {
      console.error('⚠️ Error running clean-secrets.js:', error.message);
      const proceed = await question('Do you want to continue anyway? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('🛑 Process aborted. Please fix the issues and try again.');
        process.exit(1);
      }
    }
  }
  
  // Run the fix-vercel-secrets script if it exists
  if (fs.existsSync(path.join(process.cwd(), 'scripts', 'fix-vercel-secrets.js'))) {
    console.log('🔧 Fixing Vercel configuration to remove any secrets...');
    try {
      execSync('node scripts/fix-vercel-secrets.js', { stdio: 'inherit' });
    } catch (error) {
      console.error('⚠️ Error running fix-vercel-secrets.js:', error.message);
    }
  }
  
  // Check Git status
  console.log('📊 Checking Git status...');
  const gitStatus = execSync('git status --porcelain').toString();
  
  if (gitStatus.trim()) {
    console.log('📝 Changes detected. Adding files to Git...');
    
    // Ask which files to add
    const addAll = await question('Do you want to add all files to Git? (y/n): ');
    
    if (addAll.toLowerCase() === 'y') {
      try {
        execSync('git add .', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Failed to add files to Git:', error.message);
        process.exit(1);
      }
    } else {
      console.log('Please add files manually using "git add" command and then run this script again.');
      process.exit(0);
    }
    
    // Commit changes
    const commitMessage = await question('Enter commit message: ');
    try {
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to commit changes:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ No changes to commit.');
  }
  
  // Check if remote exists
  let remoteExists = false;
  try {
    execSync('git remote -v', { stdio: 'ignore' });
    remoteExists = true;
  } catch (error) {
    console.log('⚠️ No Git remote configured.');
  }
  
  if (!remoteExists) {
    const setupRemote = await question('Do you want to set up a GitHub remote? (y/n): ');
    
    if (setupRemote.toLowerCase() === 'y') {
      const repoUrl = await question('Enter your GitHub repository URL: ');
      try {
        execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
        console.log('✅ Remote added successfully.');
      } catch (error) {
        console.error('❌ Failed to add remote:', error.message);
        process.exit(1);
      }
    }
  }
  
  // Push to GitHub
  const pushToGithub = await question('Do you want to push to GitHub? (y/n): ');
  
  if (pushToGithub.toLowerCase() === 'y') {
    const branch = await question('Enter branch name (default: main): ') || 'main';
    
    try {
      console.log(`🔼 Pushing to ${branch} branch...`);
      execSync(`git push -u origin ${branch}`, { stdio: 'inherit' });
      console.log('✅ Successfully pushed to GitHub!');
    } catch (error) {
      console.error('❌ Failed to push to GitHub:', error.message);
      console.log('This might be due to GitHub\'s secret detection or other issues.');
      
      const forcePush = await question('Do you want to force push? (y/n): ');
      if (forcePush.toLowerCase() === 'y') {
        try {
          execSync(`git push -u origin ${branch} --force`, { stdio: 'inherit' });
          console.log('✅ Successfully force pushed to GitHub!');
        } catch (error) {
          console.error('❌ Failed to force push to GitHub:', error.message);
          process.exit(1);
        }
      }
    }
  }
  
  // Deploy to Vercel
  if (vercelInstalled) {
    const deployToVercel = await question('Do you want to deploy to Vercel? (y/n): ');
    
    if (deployToVercel.toLowerCase() === 'y') {
      console.log('🚀 Deploying to Vercel...');
      
      // Check if we have a direct deployment script
      if (fs.existsSync(path.join(process.cwd(), 'scripts', 'deploy-direct-to-vercel.js'))) {
        console.log('📦 Using direct deployment script...');
        try {
          execSync('node scripts/deploy-direct-to-vercel.js', { stdio: 'inherit' });
        } catch (error) {
          console.error('❌ Direct deployment failed:', error.message);
          
          const tryRegular = await question('Do you want to try regular Vercel deployment? (y/n): ');
          if (tryRegular.toLowerCase() !== 'y') {
            process.exit(1);
          }
        }
      }
      
      // Regular Vercel deployment
      try {
        execSync('vercel', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Vercel deployment failed:', error.message);
        process.exit(1);
      }
    }
  }
  
  console.log('🎉 Process completed!');
  rl.close();
}

main().catch(error => {
  console.error('❌ An error occurred:', error);
  process.exit(1);
}); 