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
  console.log('🔧 Setting up Netlify environment variables...');
  
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
  
  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    console.error('❌ .env file not found. Please create a .env file with your environment variables.');
    process.exit(1);
  }
  
  // Read .env file
  const envFile = fs.readFileSync('.env', 'utf8');
  const envVars = {};
  
  // Parse environment variables
  envFile.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
      envVars[key] = value;
    }
  });
  
  console.log(`📝 Found ${Object.keys(envVars).length} environment variables in .env file.`);
  
  // Ask for confirmation
  const confirm = await question('Do you want to set these environment variables in Netlify? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Operation cancelled.');
    rl.close();
    return;
  }
  
  // Set environment variables in Netlify
  console.log('🔧 Setting environment variables in Netlify...');
  
  try {
    // Check if site is linked
    try {
      execSync('netlify status', { stdio: 'pipe' });
    } catch (error) {
      console.log('🔄 Site not linked. Linking site...');
      execSync('netlify link', { stdio: 'inherit' });
    }
    
    // Set each environment variable
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        console.log(`Setting ${key}...`);
        execSync(`netlify env:set ${key} "${value}"`, { stdio: 'pipe' });
      }
    }
    
    console.log('✅ Environment variables set successfully!');
    console.log('🔄 Triggering a new deployment to apply environment variables...');
    
    // Trigger a new deployment
    execSync('netlify deploy --prod', { stdio: 'inherit' });
    
    console.log('✅ Deployment completed!');
    console.log('📝 Your environment variables are now set in Netlify.');
    console.log('📝 You can manage them at https://app.netlify.com/sites/jackerbox/settings/env');
  } catch (error) {
    console.error('❌ Error setting environment variables:', error.message);
  }
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 