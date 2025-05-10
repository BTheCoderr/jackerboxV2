const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPasswords() {
  try {
    // Get all users with non-null passwords
    const users = await prisma.user.findMany({
      where: {
        password: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        password: true
      }
    });

    console.log(`Found ${users.length} users with passwords to hash`);

    // Hash each user's password
    for (const user of users) {
      // Skip if password is already hashed (starts with $2a$ or $2b$)
      if (user.password.startsWith('$2')) {
        console.log(`Password for ${user.email} is already hashed, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      console.log(`Hashed password for user: ${user.email}`);
    }

    console.log('Password hashing completed successfully');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

hashPasswords(); 