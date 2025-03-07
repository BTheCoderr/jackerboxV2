import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Creates pre-verified beta test users with different profiles
 * This allows testers to skip the verification process during onboarding
 */
async function main() {
  console.log('🚀 Creating beta test users...');
  
  // Array of beta test users with different profiles
  const betaUsers = [
    {
      name: 'Beta Renter',
      email: 'beta.renter@test.com',
      password: 'password123',
      phone: '+15555550001',
      phoneVerified: true,
      idVerified: true,
      idVerificationStatus: 'verified',
      role: 'renter' // Someone who will rent equipment
    },
    {
      name: 'Beta Owner',
      email: 'beta.owner@test.com',
      password: 'password123',
      phone: '+15555550002',
      phoneVerified: true,
      idVerified: true,
      idVerificationStatus: 'verified',
      role: 'owner' // Someone who will list equipment
    },
    {
      name: 'Beta Admin',
      email: 'beta.admin@test.com',
      password: 'password123',
      phone: '+15555550003',
      phoneVerified: true,
      idVerified: true,
      idVerificationStatus: 'verified',
      isAdmin: true,
      role: 'admin' // Admin user for testing admin features
    },
    {
      name: 'Beta Unverified',
      email: 'beta.unverified@test.com',
      password: 'password123',
      phone: '+15555550004',
      phoneVerified: false,
      idVerified: false,
      role: 'unverified' // User who needs to complete verification
    }
  ];
  
  // Create or update each beta user
  for (const userData of betaUsers) {
    const { email, password, role, ...userDetails } = userData;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          ...userDetails,
          password: hashedPassword
        }
      });
      console.log(`✅ Updated beta test user: ${updatedUser.name} (${updatedUser.email}) - Role: ${role}`);
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          ...userDetails
        }
      });
      console.log(`✅ Created beta test user: ${newUser.name} (${newUser.email}) - Role: ${role}`);
    }
  }
  
  console.log('\n🎉 Beta test users created successfully!');
  console.log('\n📝 Beta Test User Credentials:');
  betaUsers.forEach(user => {
    console.log(`- ${user.name} (${user.role}):`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Phone: ${user.phone}`);
    console.log(`  Verification Status: ${user.phoneVerified ? 'Pre-verified' : 'Needs verification'}`);
    console.log('');
  });
  
  console.log('\n📋 Next Steps:');
  console.log('1. Share these credentials with your beta testers');
  console.log('2. Direct them to your test environment URL');
  console.log('3. Remind them that this is a test environment with test mode enabled');
  console.log('4. For payment testing, they can use card number: 4242 4242 4242 4242');
}

main()
  .catch((e) => {
    console.error('❌ Error creating beta test users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 