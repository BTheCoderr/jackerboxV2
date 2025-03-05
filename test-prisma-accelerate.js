// Test script for Prisma Accelerate
// This script tests the connection to your database through Prisma Accelerate

require('dotenv').config({ path: '.env.test' });
const { PrismaClient } = require('@prisma/client');

// Check if we have the required environment variables
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('prisma://')) {
  console.error('Error: DATABASE_URL must be a valid Prisma Accelerate URL starting with prisma://');
  console.error('Current DATABASE_URL:', process.env.DATABASE_URL);
  console.error('Please update your .env.test file with a valid Prisma Accelerate URL');
  process.exit(1);
}

console.log('Testing Prisma Accelerate connection...');
console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

// Initialize Prisma client with Accelerate URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testConnection() {
  try {
    // Attempt a simple query
    console.log('Attempting to query the database...');
    const result = await prisma.user.findMany({
      take: 1,
    });
    
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
    } else {
      console.error('Failed to connect using Prisma Accelerate.');
      console.log('Make sure you have:');
      console.log('1. Created a Prisma Accelerate project at https://cloud.prisma.io');
      console.log('2. Added your database connection string to the project');
      console.log('3. Generated an API key');
      console.log('4. Updated your .env.test file with the correct Prisma Accelerate URL');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 