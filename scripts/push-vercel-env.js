#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Path to the production env file
const envFilePath = path.join(process.cwd(), '.env.production');

// Check if file exists
if (!fs.existsSync(envFilePath)) {
  console.error(`${colors.red}Error: .env.production file not found${colors.reset}`);
  process.exit(1);
}

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error(`${colors.red}Error: Vercel CLI is not installed. Install it with 'npm install -g vercel'${colors.reset}`);
  process.exit(1);
}

// Check if user is logged into Vercel
try {
  execSync('vercel whoami', { stdio: 'ignore' });
} catch (error) {
  console.error(`${colors.red}Error: You are not logged into Vercel. Run 'vercel login' first${colors.reset}`);
  process.exit(1);
}

// Read the env file
const envContent = fs.readFileSync(envFilePath, 'utf8');
const envVars = [];

// Parse the env file
envContent.split('\n').forEach(line => {
  // Skip empty lines and comments
  if (!line || line.startsWith('#')) return;
  
  // Extract key and value
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    
    if (key && value) {
      envVars.push({ key, value });
    }
  }
});

// Ask for confirmation
console.log(`${colors.yellow}Found ${envVars.length} environment variables in .env.production${colors.reset}`);
console.log(`${colors.blue}Variables to be added:${colors.reset}`);
envVars.forEach(({ key }) => {
  console.log(`  - ${key}`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`${colors.yellow}Do you want to push these variables to Vercel? (y/n) ${colors.reset}`, answer => {
  if (answer.toLowerCase() !== 'y') {
    console.log(`${colors.red}Operation cancelled${colors.reset}`);
    rl.close();
    return;
  }
  
  console.log(`${colors.yellow}Pushing environment variables to Vercel...${colors.reset}`);
  
  // Push each variable to Vercel
  envVars.forEach(({ key, value }) => {
    try {
      console.log(`Adding ${key}...`);
      const command = `vercel env add ${key} production`;
      const child = require('child_process').spawn('vercel', ['env', 'add', key, 'production'], {
        stdio: ['pipe', process.stdout, process.stderr]
      });
      child.stdin.write(value + '\n');
      child.stdin.end();
      
      // Wait for the process to complete
      const code = child.exitCode;
      if (code !== 0) {
        console.error(`${colors.red}Failed to add ${key}${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}Error adding ${key}: ${error.message}${colors.reset}`);
    }
  });
  
  console.log(`${colors.green}Environment variables have been pushed to Vercel!${colors.reset}`);
  console.log(`${colors.yellow}Note: You need to redeploy your application for changes to take effect.${colors.reset}`);
  console.log(`${colors.yellow}Run 'vercel --prod' to deploy to production.${colors.reset}`);
  
  rl.close();
});

// Handle SIGINT (Ctrl+C)
rl.on('SIGINT', () => {
  console.log(`${colors.red}Operation cancelled${colors.reset}`);
  rl.close();
  process.exit(0);
}); 