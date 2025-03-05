// Deploy with Prisma Accelerate script
// This script helps prepare your application for deployment with Prisma Accelerate
// Run with: node deploy-with-accelerate.js

import { config } from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Load environment variables
config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to mask sensitive information in URLs
function maskSensitiveInfo(url) {
  if (!url) return '';
  
  // Mask password in PostgreSQL URL
  let maskedUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  
  // Mask API key in Prisma Accelerate URL
  maskedUrl = maskedUrl.replace(/api_key=([^&]+)/, 'api_key=***');
  
  return maskedUrl;
}

console.log(`${colors.cyan}=== Deploy with Prisma Accelerate ====${colors.reset}`);
console.log('');

// Check if we have the required environment variables
const directUrl = process.env.DIRECT_DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL;

if (!directUrl) {
  console.error(`${colors.red}Error: DIRECT_DATABASE_URL is not defined in your .env file.${colors.reset}`);
  process.exit(1);
}

// Check if DATABASE_URL is a Prisma Accelerate URL
const isAccelerateUrl = databaseUrl && databaseUrl.startsWith('prisma://');

if (!isAccelerateUrl) {
  console.log(`${colors.yellow}Warning: Your DATABASE_URL is not a Prisma Accelerate URL.${colors.reset}`);
  console.log(`${colors.yellow}For optimal performance in production, it's recommended to use Prisma Accelerate.${colors.reset}`);
  console.log('');
  
  rl.question(`${colors.cyan}Do you want to set up Prisma Accelerate now? (y/n): ${colors.reset}`, (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('');
      console.log(`${colors.green}Running Prisma Accelerate setup script...${colors.reset}`);
      rl.close();
      
      try {
        execSync('node generate-prisma-accelerate-key.js', { stdio: 'inherit' });
      } catch (error) {
        console.error(`${colors.red}Error running Prisma Accelerate setup script:${colors.reset}`, error);
        process.exit(1);
      }
    } else {
      console.log('');
      console.log(`${colors.yellow}Continuing without Prisma Accelerate.${colors.reset}`);
      console.log(`${colors.yellow}Your application will use direct database connections.${colors.reset}`);
      rl.close();
      continueDeployment(false);
    }
  });
} else {
  console.log(`${colors.green}✓ Prisma Accelerate is configured correctly.${colors.reset}`);
  console.log(`${colors.green}DATABASE_URL: ${maskSensitiveInfo(databaseUrl)}${colors.reset}`);
  continueDeployment(true);
}

function continueDeployment(usingAccelerate) {
  console.log('');
  console.log(`${colors.cyan}=== Deployment Preparation ====${colors.reset}`);
  
  // Check deployment target
  console.log('');
  console.log(`${colors.yellow}Where would you like to deploy your application?${colors.reset}`);
  console.log('1. Vercel');
  console.log('2. Netlify');
  console.log('3. Other/Custom');
  
  rl.question(`${colors.cyan}Enter your choice (1-3): ${colors.reset}`, (choice) => {
    switch (choice) {
      case '1':
        prepareVercelDeployment(usingAccelerate);
        break;
      case '2':
        prepareNetlifyDeployment(usingAccelerate);
        break;
      case '3':
        prepareCustomDeployment(usingAccelerate);
        break;
      default:
        console.log(`${colors.red}Invalid choice. Please run the script again.${colors.reset}`);
        rl.close();
        process.exit(1);
    }
  });
}

function prepareVercelDeployment(usingAccelerate) {
  console.log('');
  console.log(`${colors.cyan}Preparing for Vercel deployment...${colors.reset}`);
  
  // Check if vercel.json exists
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  let vercelJson = {};
  
  if (fs.existsSync(vercelJsonPath)) {
    try {
      vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    } catch (error) {
      console.error(`${colors.red}Error reading vercel.json:${colors.reset}`, error);
      vercelJson = {};
    }
  }
  
  // Update or create vercel.json
  vercelJson.build = vercelJson.build || {};
  vercelJson.build.env = vercelJson.build.env || {};
  vercelJson.env = vercelJson.env || {};
  
  if (usingAccelerate) {
    // Enable Prisma Data Proxy generation
    vercelJson.build.env.PRISMA_GENERATE_DATAPROXY = "true";
    
    // Set DATABASE_URL to Prisma Accelerate URL
    vercelJson.env.DATABASE_URL = process.env.DATABASE_URL;
    
    // Set DIRECT_DATABASE_URL as fallback
    vercelJson.env.DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL;
  } else {
    // Use direct connection
    vercelJson.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
  }
  
  // Write updated vercel.json
  fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2));
  console.log(`${colors.green}✓ Updated vercel.json with ${usingAccelerate ? 'Prisma Accelerate' : 'direct connection'} configuration.${colors.reset}`);
  
  // Create or update .env.production
  const envProdPath = path.join(process.cwd(), '.env.production');
  let envProdContent = '';
  
  if (fs.existsSync(envProdPath)) {
    envProdContent = fs.readFileSync(envProdPath, 'utf8');
  }
  
  // Update DATABASE_URL
  if (envProdContent.includes('DATABASE_URL=')) {
    envProdContent = envProdContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL="${usingAccelerate ? process.env.DATABASE_URL : process.env.DIRECT_DATABASE_URL}"`
    );
  } else {
    envProdContent = `DATABASE_URL="${usingAccelerate ? process.env.DATABASE_URL : process.env.DIRECT_DATABASE_URL}"\n${envProdContent}`;
  }
  
  // Update DIRECT_DATABASE_URL if using Accelerate
  if (usingAccelerate) {
    if (envProdContent.includes('DIRECT_DATABASE_URL=')) {
      envProdContent = envProdContent.replace(
        /DIRECT_DATABASE_URL=.*/,
        `DIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"`
      );
    } else {
      envProdContent = `${envProdContent}\nDIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"`;
    }
  }
  
  fs.writeFileSync(envProdPath, envProdContent);
  console.log(`${colors.green}✓ Updated .env.production with ${usingAccelerate ? 'Prisma Accelerate' : 'direct connection'} configuration.${colors.reset}`);
  
  console.log('');
  console.log(`${colors.green}Your application is ready for deployment to Vercel!${colors.reset}`);
  console.log(`${colors.yellow}Next steps:${colors.reset}`);
  console.log('1. Push your changes to your Git repository');
  console.log('2. Connect your repository to Vercel');
  console.log('3. Deploy your application');
  
  rl.close();
}

function prepareNetlifyDeployment(usingAccelerate) {
  console.log('');
  console.log(`${colors.cyan}Preparing for Netlify deployment...${colors.reset}`);
  
  // Check if netlify.toml exists
  const netlifyTomlPath = path.join(process.cwd(), 'netlify.toml');
  let netlifyToml = '';
  
  if (fs.existsSync(netlifyTomlPath)) {
    netlifyToml = fs.readFileSync(netlifyTomlPath, 'utf8');
  } else {
    netlifyToml = `[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
`;
  }
  
  // Add or update Prisma Accelerate configuration
  if (usingAccelerate) {
    if (!netlifyToml.includes('PRISMA_GENERATE_DATAPROXY')) {
      netlifyToml = netlifyToml.replace(
        '[build.environment]',
        '[build.environment]\n  PRISMA_GENERATE_DATAPROXY = "true"'
      );
    }
  }
  
  fs.writeFileSync(netlifyTomlPath, netlifyToml);
  console.log(`${colors.green}✓ Updated netlify.toml with ${usingAccelerate ? 'Prisma Accelerate' : 'direct connection'} configuration.${colors.reset}`);
  
  // Create or update .env.netlify
  const envNetlifyPath = path.join(process.cwd(), '.env.netlify');
  let envNetlifyContent = '';
  
  if (fs.existsSync(envNetlifyPath)) {
    envNetlifyContent = fs.readFileSync(envNetlifyPath, 'utf8');
  }
  
  // Update DATABASE_URL
  if (envNetlifyContent.includes('DATABASE_URL=')) {
    envNetlifyContent = envNetlifyContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL="${usingAccelerate ? process.env.DATABASE_URL : process.env.DIRECT_DATABASE_URL}"`
    );
  } else {
    envNetlifyContent = `DATABASE_URL="${usingAccelerate ? process.env.DATABASE_URL : process.env.DIRECT_DATABASE_URL}"\n${envNetlifyContent}`;
  }
  
  // Update DIRECT_DATABASE_URL if using Accelerate
  if (usingAccelerate) {
    if (envNetlifyContent.includes('DIRECT_DATABASE_URL=')) {
      envNetlifyContent = envNetlifyContent.replace(
        /DIRECT_DATABASE_URL=.*/,
        `DIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"`
      );
    } else {
      envNetlifyContent = `${envNetlifyContent}\nDIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"`;
    }
  }
  
  fs.writeFileSync(envNetlifyPath, envNetlifyContent);
  console.log(`${colors.green}✓ Updated .env.netlify with ${usingAccelerate ? 'Prisma Accelerate' : 'direct connection'} configuration.${colors.reset}`);
  
  console.log('');
  console.log(`${colors.green}Your application is ready for deployment to Netlify!${colors.reset}`);
  console.log(`${colors.yellow}Next steps:${colors.reset}`);
  console.log('1. Push your changes to your Git repository');
  console.log('2. Connect your repository to Netlify');
  console.log('3. In the Netlify dashboard, add the following environment variables:');
  console.log(`   DATABASE_URL: ${maskSensitiveInfo(usingAccelerate ? process.env.DATABASE_URL : process.env.DIRECT_DATABASE_URL)}`);
  if (usingAccelerate) {
    console.log(`   DIRECT_DATABASE_URL: ${maskSensitiveInfo(process.env.DIRECT_DATABASE_URL)}`);
  }
  
  rl.close();
}

function prepareCustomDeployment(usingAccelerate) {
  console.log('');
  console.log(`${colors.cyan}Preparing for custom deployment...${colors.reset}`);
  
  // Create or update .env.production
  const envProdPath = path.join(process.cwd(), '.env.production');
  let envProdContent = '';
  
  if (fs.existsSync(envProdPath)) {
    envProdContent = fs.readFileSync(envProdPath, 'utf8');
  }
  
  // Update DATABASE_URL
  if (envProdContent.includes('DATABASE_URL=')) {
    envProdContent = envProdContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL="${usingAccelerate ? process.env.DATABASE_URL : process.env.DIRECT_DATABASE_URL}"`
    );
  } else {
    envProdContent = `DATABASE_URL="${usingAccelerate ? process.env.DATABASE_URL : process.env.DIRECT_DATABASE_URL}"\n${envProdContent}`;
  }
  
  // Update DIRECT_DATABASE_URL if using Accelerate
  if (usingAccelerate) {
    if (envProdContent.includes('DIRECT_DATABASE_URL=')) {
      envProdContent = envProdContent.replace(
        /DIRECT_DATABASE_URL=.*/,
        `DIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"`
      );
    } else {
      envProdContent = `${envProdContent}\nDIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"`;
    }
  }
  
  fs.writeFileSync(envProdPath, envProdContent);
  console.log(`${colors.green}✓ Updated .env.production with ${usingAccelerate ? 'Prisma Accelerate' : 'direct connection'} configuration.${colors.reset}`);
  
  console.log('');
  console.log(`${colors.green}Your application is ready for custom deployment!${colors.reset}`);
  console.log(`${colors.yellow}Next steps:${colors.reset}`);
  console.log('1. Make sure your deployment environment has the following environment variables:');
  console.log(`   DATABASE_URL: ${maskSensitiveInfo(usingAccelerate ? process.env.DATABASE_URL : process.env.DIRECT_DATABASE_URL)}`);
  if (usingAccelerate) {
    console.log(`   DIRECT_DATABASE_URL: ${maskSensitiveInfo(process.env.DIRECT_DATABASE_URL)}`);
    console.log('2. If your deployment process includes Prisma Client generation, set PRISMA_GENERATE_DATAPROXY=true');
  }
  
  rl.close();
} 