import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Get email and phone from command line arguments
const email = process.argv[2];
const phone = process.argv[3] || '+15555555555'; // Default test phone number

if (!email) {
  console.error('❌ Please provide an email address as an argument.');
  console.error('Example: node scripts/set-test-phone.js user@example.com +15555555555');
  process.exit(1);
}

async function main() {
  console.log(`🔄 Setting test phone number for user with email: ${email}`);
  console.log(`📱 Phone number to set: ${phone}`);
  
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
    console.log(`  Current Phone: ${user.phone || 'N/A'}`);
    console.log(`  Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
    
    // Set test phone number and reset verification
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        phone,
        phoneVerified: false,
        verificationToken: null
      }
    });
    
    console.log('\n✅ Phone number updated successfully:');
    console.log(`  New Phone: ${updatedUser.phone}`);
    console.log(`  Phone Verified: ${updatedUser.phoneVerified ? 'Yes' : 'No'}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log(`  Email: ${updatedUser.email}`);
    console.log('  Password: Use the password you set or "password123" for test accounts');
    console.log('\n📝 Next Steps:');
    console.log('  1. Log in with the credentials above');
    console.log('  2. Go to your profile page');
    console.log('  3. Verify your phone number using the test verification code: 123456');
    
  } catch (error) {
    console.error('Error setting test phone number:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 