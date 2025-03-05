// Test script to compare direct database connection vs Prisma Accelerate
// Run with: node test-connection-methods.js

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Load environment variables
config();

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

console.log(`${colors.cyan}=== Database Connection Test ====${colors.reset}`);
console.log('');

// Check if we have the required environment variables
const directUrl = process.env.DIRECT_DATABASE_URL;
const accelerateUrl = process.env.DATABASE_URL;

if (!directUrl) {
  console.error(`${colors.red}Error: DIRECT_DATABASE_URL is not defined in your .env file.${colors.reset}`);
  process.exit(1);
}

if (!accelerateUrl) {
  console.error(`${colors.red}Error: DATABASE_URL is not defined in your .env file.${colors.reset}`);
  process.exit(1);
}

// Create Prisma clients for both connection methods
const directPrisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl,
    },
  },
});

// Check if we should use Accelerate
const isAccelerateUrl = accelerateUrl.startsWith('prisma://');
let acceleratePrisma;

if (isAccelerateUrl) {
  console.log(`${colors.green}Using Prisma Accelerate URL for accelerated connection${colors.reset}`);
  acceleratePrisma = new PrismaClient({
    datasources: {
      db: {
        url: accelerateUrl,
      },
    },
  }).$extends(withAccelerate());
} else {
  console.log(`${colors.yellow}Warning: DATABASE_URL is not a Prisma Accelerate URL${colors.reset}`);
  console.log(`${colors.yellow}Using standard connection for both tests${colors.reset}`);
  acceleratePrisma = new PrismaClient({
    datasources: {
      db: {
        url: accelerateUrl,
      },
    },
  });
}

// Test direct connection
async function testDirectConnection() {
  console.log(`${colors.blue}Testing direct database connection...${colors.reset}`);
  console.log(`URL: ${maskSensitiveInfo(directUrl)}`);
  
  const startTime = Date.now();
  
  try {
    // Try a simple query
    const result = await directPrisma.user.findMany({ take: 1 });
    const duration = Date.now() - startTime;
    
    console.log(`${colors.green}✓ Direct connection successful (${duration}ms)${colors.reset}`);
    console.log(`Retrieved ${result.length} user(s)`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Direct connection failed:${colors.reset}`);
    console.error(error);
    return false;
  } finally {
    await directPrisma.$disconnect();
  }
}

// Test Accelerate connection
async function testAccelerateConnection() {
  console.log(`${colors.blue}Testing ${isAccelerateUrl ? 'Prisma Accelerate' : 'standard'} connection...${colors.reset}`);
  console.log(`URL: ${maskSensitiveInfo(accelerateUrl)}`);
  
  const startTime = Date.now();
  
  try {
    // Try a simple query
    const result = await acceleratePrisma.user.findMany({ take: 1 });
    const duration = Date.now() - startTime;
    
    console.log(`${colors.green}✓ ${isAccelerateUrl ? 'Accelerate' : 'Standard'} connection successful (${duration}ms)${colors.reset}`);
    console.log(`Retrieved ${result.length} user(s)`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ ${isAccelerateUrl ? 'Accelerate' : 'Standard'} connection failed:${colors.reset}`);
    console.error(error);
    return false;
  } finally {
    await acceleratePrisma.$disconnect();
  }
}

// Run both tests
async function runTests() {
  console.log('');
  const directResult = await testDirectConnection();
  
  console.log('');
  const accelerateResult = await testAccelerateConnection();
  
  console.log('');
  console.log(`${colors.cyan}=== Test Results ====${colors.reset}`);
  console.log(`Direct connection: ${directResult ? colors.green + 'SUCCESS' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`${isAccelerateUrl ? 'Accelerate' : 'Standard'} connection: ${accelerateResult ? colors.green + 'SUCCESS' : colors.red + 'FAILED'}${colors.reset}`);
  
  if (directResult && !accelerateResult && isAccelerateUrl) {
    console.log('');
    console.log(`${colors.yellow}It appears your Prisma Accelerate configuration is not working correctly.${colors.reset}`);
    console.log(`${colors.yellow}Please check your Prisma Accelerate API key and make sure your project is set up correctly.${colors.reset}`);
    console.log(`${colors.yellow}You can generate a new API key at https://cloud.prisma.io${colors.reset}`);
  }
  
  if (!directResult) {
    console.log('');
    console.log(`${colors.yellow}Your direct database connection is not working.${colors.reset}`);
    console.log(`${colors.yellow}Please check your DIRECT_DATABASE_URL in your .env file.${colors.reset}`);
  }
  
  return directResult || accelerateResult;
}

runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
    process.exit(1);
  }); 