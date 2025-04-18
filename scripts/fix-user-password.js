import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function fixUserPassword() {
  // Define the user email and new password
  const email = 'owner1@test.com';
  const password = 'password123';

  try {
    // Hash the password with bcrypt (10 rounds is standard)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✅ Password updated successfully for ${email}`);
    console.log('User ID:', updatedUser.id);
    
    // Display login credentials for convenience
    console.log('\nLogin credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the function
fixUserPassword()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 