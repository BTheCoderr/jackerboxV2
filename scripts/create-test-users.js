#!/usr/bin/env node

/**
 * This script creates test users with different verification statuses
 * for documentation and testing purposes.
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test users with different verification statuses...');
    
    // Create a pending verification user
    const pendingUser = await prisma.user.upsert({
      where: { email: 'pending@test.com' },
      update: {},
      create: {
        email: 'pending@test.com',
        name: 'Alex Taylor',
        password: await hash('password123', 10),
        emailVerified: new Date(),
        phoneVerified: true,
        phone: '5559876543',
        idVerified: false,
        idVerificationStatus: 'pending',
        bio: 'New user waiting for ID verification approval.',
      },
    });
    
    // Create a rejected verification user
    const rejectedUser = await prisma.user.upsert({
      where: { email: 'rejected@test.com' },
      update: {},
      create: {
        email: 'rejected@test.com',
        name: 'Jordan Smith',
        password: await hash('password123', 10),
        emailVerified: new Date(),
        phoneVerified: true,
        phone: '5558765432',
        idVerified: false,
        idVerificationStatus: 'rejected',
        idVerificationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        bio: 'User with rejected ID verification.',
      },
    });
    
    // Create a new unverified user
    const newUser = await prisma.user.upsert({
      where: { email: 'new@test.com' },
      update: {},
      create: {
        email: 'new@test.com',
        name: 'Riley Morgan',
        password: await hash('password123', 10),
        emailVerified: new Date(),
        phoneVerified: false,
        idVerified: false,
        idVerificationStatus: null,
        bio: 'Brand new user who has not started verification.',
      },
    });

    console.log('Created test users with different verification statuses:');
    console.log('1. Pending User: pending@test.com / password123');
    console.log('2. Rejected User: rejected@test.com / password123');
    console.log('3. New User: new@test.com / password123');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 