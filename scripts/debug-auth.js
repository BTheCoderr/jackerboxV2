// Debug authentication issues
const { PrismaClient } = require('@prisma/client');
const { compare, hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Debugging authentication issues...');
  
  try {
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        email: 'test@example.com'
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true
      }
    });
    
    if (!user) {
      console.log('❌ User test@example.com not found in the database');
      console.log('Let\'s create this user now...');
      
      // Create the user with a known password
      const hashedPassword = await hash('password123', 10);
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword,
          emailVerified: new Date()
        }
      });
      
      console.log('✅ Created new user:', newUser.email);
      return;
    }
    
    console.log('✅ User found:', user.email);
    
    // Check if the password is correct
    if (!user.password) {
      console.log('❌ User has no password set');
      
      // Set a password
      const hashedPassword = await hash('password123', 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Password set for user');
      return;
    }
    
    // Test password verification
    const isPasswordValid = await compare('password123', user.password);
    console.log(`Password verification: ${isPasswordValid ? '✅ Success' : '❌ Failed'}`);
    
    if (!isPasswordValid) {
      console.log('Current password hash:', user.password);
      
      // Update the password
      const newHashedPassword = await hash('password123', 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword }
      });
      
      console.log('✅ Password updated for user');
      console.log('New password hash:', newHashedPassword);
    }
    
    // Create a test admin user if needed
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (!adminExists) {
      const hashedPassword = await hash('password123', 10);
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: hashedPassword,
          emailVerified: new Date(),
          isAdmin: true
        }
      });
      
      console.log('✅ Created admin user:', adminUser.email);
    }
    
  } catch (error) {
    console.error('Error during authentication debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 