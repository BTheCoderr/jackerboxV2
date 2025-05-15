// Database seed script for test users
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  
  try {
    // Create a test user with email/password login
    const hashedPassword = await hash('password123', 10);
    
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        name: 'Test User',
        password: hashedPassword,
      },
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });
    
    console.log(`Created/updated test user: ${testUser.email}`);
    
    // Create a test admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        name: 'Admin User',
        password: hashedPassword,
        isAdmin: true,
      },
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        emailVerified: new Date(),
        isAdmin: true,
      },
    });
    
    console.log(`Created/updated admin user: ${adminUser.email}`);
    
    console.log('Database seed completed successfully!');
    console.log('\nTest credentials:');
    console.log('- Regular user: test@example.com / password123');
    console.log('- Admin user: admin@example.com / password123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 