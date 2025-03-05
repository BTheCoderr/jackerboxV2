// This script helps you generate and test a Prisma Accelerate API key
// Run with: node generate-prisma-accelerate-key.js

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

console.log(`${colors.cyan}=== Prisma Accelerate API Key Generator and Tester ===${colors.reset}`);
console.log('');

// Check if Prisma CLI is installed
try {
  execSync('npx prisma --version', { stdio: 'pipe' });
} catch (error) {
  console.error(`${colors.red}Error: Prisma CLI is not installed. Please run 'npm install prisma' first.${colors.reset}`);
  process.exit(1);
}

// Check if we have a direct database URL
if (!process.env.DIRECT_DATABASE_URL) {
  console.error(`${colors.red}Error: DIRECT_DATABASE_URL is not defined in your .env file.${colors.reset}`);
  console.log(`Please add your direct database connection string to your .env file:`);
  console.log(`DIRECT_DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"`);
  process.exit(1);
}

console.log(`${colors.green}✓ Direct database URL found in environment variables.${colors.reset}`);
console.log('');

console.log(`${colors.yellow}To generate a Prisma Accelerate API key, you need to:${colors.reset}`);
console.log('1. Sign up for Prisma Data Platform at https://cloud.prisma.io');
console.log('2. Create a new project');
console.log('3. Add your database connection string (use the DIRECT_DATABASE_URL from your .env file)');
console.log('4. Generate an API key');
console.log('');

// Ask if the user has already generated an API key
rl.question(`${colors.cyan}Have you already generated a Prisma Accelerate API key? (y/n): ${colors.reset}`, (hasKey) => {
  if (hasKey.toLowerCase() === 'y') {
    rl.question(`${colors.cyan}Please enter your Prisma Accelerate API key: ${colors.reset}`, (apiKey) => {
      if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_PRISMA_ACCELERATE_API_KEY') {
        console.log(`${colors.red}Error: Invalid API key provided.${colors.reset}`);
        rl.close();
        process.exit(1);
      }

      // Create a test environment file with the provided API key
      const testEnvContent = `# Test environment with Prisma Accelerate URL
DATABASE_URL="prisma://aws-us-east-2.prisma-data.com/?api_key=${apiKey.trim()}"
DIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"
`;

      fs.writeFileSync(path.join(process.cwd(), '.env.accelerate-test'), testEnvContent);
      console.log(`${colors.green}✓ Created .env.accelerate-test file with your API key.${colors.reset}`);
      
      // Test the connection
      console.log(`${colors.yellow}Testing connection to Prisma Accelerate...${colors.reset}`);
      
      try {
        // Create a simple test script
        const testScriptContent = `
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import fs from 'fs';

// Load environment variables from .env.accelerate-test
config({ path: '.env.accelerate-test' });

// Helper function to mask sensitive information in URLs
function maskSensitiveInfo(url) {
  if (!url) return '';
  
  // Mask password in PostgreSQL URL
  let maskedUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  
  // Mask API key in Prisma Accelerate URL
  maskedUrl = maskedUrl.replace(/api_key=([^&]+)/, 'api_key=***');
  
  return maskedUrl;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}).$extends(withAccelerate());

async function testConnection() {
  try {
    console.log('Attempting to connect to database via Prisma Accelerate...');
    console.log('Using DATABASE_URL:', maskSensitiveInfo(process.env.DATABASE_URL));
    
    // Try a simple query
    const result = await prisma.user.findMany({ take: 1 });
    console.log('Connection successful!');
    console.log('Retrieved data:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('Prisma Accelerate is working correctly!');
      
      // Update the .env.production file
      const envProdPath = '.env.production';
      if (fs.existsSync(envProdPath)) {
        let envProdContent = fs.readFileSync(envProdPath, 'utf8');
        envProdContent = envProdContent.replace(
          /DATABASE_URL="prisma:\/\/aws-us-east-2\.prisma-data\.com\/\?api_key=[^"]*"/,
          \`DATABASE_URL="prisma://aws-us-east-2.prisma-data.com/?api_key=${apiKey.trim()}"\`
        );
        fs.writeFileSync(envProdPath, envProdContent);
        console.log('Updated .env.production with the new API key.');
      }
      
      // Update vercel.json if it exists
      const vercelJsonPath = 'vercel.json';
      if (fs.existsSync(vercelJsonPath)) {
        let vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
        if (vercelJson.env && vercelJson.env.DATABASE_URL) {
          vercelJson.env.DATABASE_URL = \`prisma://aws-us-east-2.prisma-data.com/?api_key=${apiKey.trim()}\`;
          fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2));
          console.log('Updated vercel.json with the new API key.');
        }
      }
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
`;

        fs.writeFileSync(path.join(process.cwd(), 'test-accelerate-connection.js'), testScriptContent);
        
        // Run the test script
        execSync('node test-accelerate-connection.js', { stdio: 'inherit' });
        
        // Clean up
        fs.unlinkSync(path.join(process.cwd(), 'test-accelerate-connection.js'));
        
        console.log('');
        console.log(`${colors.green}✓ Test completed successfully.${colors.reset}`);
        console.log(`${colors.cyan}Your Prisma Accelerate API key has been saved to .env.accelerate-test${colors.reset}`);
        console.log(`${colors.cyan}You can now use this API key in your production environment.${colors.reset}`);
        
        rl.question(`${colors.yellow}Would you like to update your .env file with this API key? (y/n): ${colors.reset}`, (updateEnv) => {
          if (updateEnv.toLowerCase() === 'y') {
            try {
              let envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
              
              // Check if DATABASE_URL already exists
              if (envContent.includes('DATABASE_URL=')) {
                // Replace existing DATABASE_URL
                envContent = envContent.replace(
                  /DATABASE_URL=.*/,
                  `DATABASE_URL="prisma://aws-us-east-2.prisma-data.com/?api_key=${apiKey.trim()}"`
                );
              } else {
                // Add DATABASE_URL at the beginning
                envContent = `DATABASE_URL="prisma://aws-us-east-2.prisma-data.com/?api_key=${apiKey.trim()}"\n${envContent}`;
              }
              
              fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
              console.log(`${colors.green}✓ Updated .env file with your Prisma Accelerate API key.${colors.reset}`);
            } catch (error) {
              console.error(`${colors.red}Error updating .env file:${colors.reset}`, error);
            }
          }
          
          rl.close();
        });
      } catch (error) {
        console.error(`${colors.red}Error testing connection:${colors.reset}`, error.toString());
        rl.close();
      }
    });
  } else {
    console.log('');
    console.log(`${colors.magenta}Please follow these steps to generate a Prisma Accelerate API key:${colors.reset}`);
    console.log('1. Go to https://cloud.prisma.io and sign up or log in');
    console.log('2. Create a new project');
    console.log('3. When prompted for your database connection string, use:');
    console.log(`   ${colors.cyan}${maskSensitiveInfo(process.env.DIRECT_DATABASE_URL)}${colors.reset}`);
    console.log('4. Follow the instructions to generate an API key');
    console.log('5. Run this script again and enter your API key when prompted');
    console.log('');
    rl.close();
  }
}); 