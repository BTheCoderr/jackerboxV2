import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Get email from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3] || 'password123'; // Default password

if (!email) {
  console.error('❌ Please provide an email address as an argument.');
  console.error('Example: node scripts/reset-user-password.js user@example.com password123');
  process.exit(1);
}

async function main() {
  console.log(`🔄 Resetting password for user with email: ${email}`);
  console.log(`🔑 New password will be: ${newPassword}`);
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true
      }
    });
    
    if (!user) {
      console.error(`❌ User with email ${email} not found.`);
      process.exit(1);
    }
    
    console.log('\n👤 User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Email: ${user.email}`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('\n✅ Password reset successfully!');
    
    console.log('\n🔑 Test Credentials:');
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Password: ${newPassword}`);
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 