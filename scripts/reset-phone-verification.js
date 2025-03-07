import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address as an argument.');
  console.error('Example: node scripts/reset-phone-verification.js user@example.com');
  process.exit(1);
}

async function main() {
  console.log(`🔄 Resetting phone verification for user with email: ${email}`);
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true
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
    console.log(`  Phone: ${user.phone || 'N/A'}`);
    console.log(`  Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
    
    // Reset phone verification
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        phoneVerified: false,
        verificationToken: null
      }
    });
    
    console.log('\n✅ Phone verification reset successfully:');
    console.log(`  Phone Verified: ${updatedUser.phoneVerified ? 'Yes' : 'No'}`);
    console.log(`  Verification Token: ${updatedUser.verificationToken || 'None'}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log(`  Email: ${updatedUser.email}`);
    console.log('  Password: Use the password you set or "password123" for test accounts');
    
  } catch (error) {
    console.error('Error resetting phone verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 