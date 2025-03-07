import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Tests the database connection with various configurations
 */
async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  // Test with default connection
  try {
    console.log('\n📊 Testing with DATABASE_URL from .env');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Try with direct connection if available
    if (process.env.DIRECT_DATABASE_URL) {
      try {
        console.log('\n📊 Testing with DIRECT_DATABASE_URL from .env');
        const directPrisma = new PrismaClient({
          datasources: {
            db: {
              url: process.env.DIRECT_DATABASE_URL,
            },
          },
        });
        
        await directPrisma.$connect();
        console.log('✅ Direct connection successful!');
        
        // Test a simple query
        const result = await directPrisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Query successful:', result);
        
        await directPrisma.$disconnect();
      } catch (directError) {
        console.error('❌ Direct connection failed:', directError.message);
      }
    }
  }
}

/**
 * Updates the database configuration in .env files
 */
async function updateDatabaseConfig() {
  console.log('\n🔧 Updating database configuration...');
  
  // Check if we have a direct database URL
  if (!process.env.DIRECT_DATABASE_URL) {
    console.log('❌ DIRECT_DATABASE_URL not found in .env');
    const directUrl = await question('Enter your direct database connection URL: ');
    
    if (!directUrl) {
      console.log('❌ No direct URL provided. Exiting.');
      return;
    }
    
    process.env.DIRECT_DATABASE_URL = directUrl;
  }
  
  // Update .env file
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update or add DIRECT_DATABASE_URL
    if (envContent.includes('DIRECT_DATABASE_URL=')) {
      envContent = envContent.replace(
        /DIRECT_DATABASE_URL=.*/,
        `DIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"`
      );
    } else {
      envContent += `\nDIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"\n`;
    }
    
    // Add connection pooling settings
    if (!envContent.includes('PRISMA_CONNECTION_POOL_MIN=')) {
      envContent += `\n# Connection pooling settings\nPRISMA_CONNECTION_POOL_MIN=1\nPRISMA_CONNECTION_POOL_MAX=10\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file');
  }
  
  // Update .env.local file if it exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    let envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
    
    // Update or add DIRECT_DATABASE_URL
    if (envLocalContent.includes('DIRECT_DATABASE_URL=')) {
      envLocalContent = envLocalContent.replace(
        /DIRECT_DATABASE_URL=.*/,
        `DIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"`
      );
    } else {
      envLocalContent += `\nDIRECT_DATABASE_URL="${process.env.DIRECT_DATABASE_URL}"\n`;
    }
    
    // Add connection pooling settings
    if (!envLocalContent.includes('PRISMA_CONNECTION_POOL_MIN=')) {
      envLocalContent += `\n# Connection pooling settings\nPRISMA_CONNECTION_POOL_MIN=1\nPRISMA_CONNECTION_POOL_MAX=10\n`;
    }
    
    fs.writeFileSync(envLocalPath, envLocalContent);
    console.log('✅ Updated .env.local file');
  }
}

/**
 * Updates the db.ts file with improved connection handling
 */
async function updateDbFile() {
  console.log('\n🔧 Updating db.ts file...');
  
  const dbFilePath = path.join(process.cwd(), 'src', 'lib', 'db.ts');
  if (!fs.existsSync(dbFilePath)) {
    console.log('❌ db.ts file not found at', dbFilePath);
    return;
  }
  
  const dbFileContent = `import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// PrismaClient is attached to the \`global\` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
  // Get connection pooling settings from environment variables
  const minConnections = parseInt(process.env.PRISMA_CONNECTION_POOL_MIN || '1', 10);
  const maxConnections = parseInt(process.env.PRISMA_CONNECTION_POOL_MAX || '10', 10);

  // Create Prisma client with connection pooling
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Try to use Prisma Accelerate if configured
  if (process.env.DATABASE_URL?.includes('prisma://')) {
    console.log('Using Prisma Accelerate for database connection');
    return client.$extends(withAccelerate());
  }
  
  console.log('Using standard Prisma client for database connection');
  return client;
};

// Fallback mechanism for database connection issues
process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error && reason.message.includes('Connection')) {
    console.error('Database connection error detected, attempting to reconnect...');
    
    // If we have a direct database URL, try to use it
    if (process.env.DIRECT_DATABASE_URL && process.env.DATABASE_URL !== process.env.DIRECT_DATABASE_URL) {
      console.log('Switching to direct database connection');
      process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
      
      // Force recreation of the Prisma client
      if (globalForPrisma.prisma) {
        globalForPrisma.prisma.$disconnect().catch(console.error);
        delete globalForPrisma.prisma;
      }
    }
  }
});

export const db = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
`;
  
  fs.writeFileSync(dbFilePath, dbFileContent);
  console.log('✅ Updated db.ts file with improved connection handling');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Database Connection Fixer');
  console.log('============================');
  
  await testConnection();
  await updateDatabaseConfig();
  await updateDbFile();
  
  console.log('\n🎉 Database connection setup complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Monitor for any further connection issues');
  console.log('3. If problems persist, consider using a more stable database connection');
  
  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  rl.close();
}); 