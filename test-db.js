import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Database connection successful! Found ${userCount} users.`);
    
    // Get a sample user to verify data access
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true
      }
    });
    
    if (users.length > 0) {
      console.log('Sample user:', users[0]);
    } else {
      console.log('No users found in the database.');
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 