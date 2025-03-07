import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding test users in the database...');
  
  try {
    // Find all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        createdAt: true,
        isAdmin: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`\n📊 Found ${users.length} users:`);
    
    // Display user information
    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Phone: ${user.phone || 'N/A'}`);
      console.log(`  Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
      console.log(`  Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`  Created: ${user.createdAt.toLocaleString()}`);
    });
    
    // Find users with verified phones
    const verifiedUsers = users.filter(user => user.phoneVerified);
    console.log(`\n✅ Users with verified phones: ${verifiedUsers.length}`);
    
    // Find users with unverified phones
    const unverifiedUsers = users.filter(user => !user.phoneVerified && user.phone);
    console.log(`\n❌ Users with unverified phones: ${unverifiedUsers.length}`);
    
    // Find users without phones
    const noPhoneUsers = users.filter(user => !user.phone);
    console.log(`\n📱 Users without phones: ${noPhoneUsers.length}`);
    
    console.log('\n🔑 Test Credentials:');
    if (users.length > 0) {
      console.log(`  Email: ${users[0].email}`);
      console.log('  Password: Use the password you set or "password123" for test accounts');
    } else {
      console.log('  No users found');
    }
    
  } catch (error) {
    console.error('Error finding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 