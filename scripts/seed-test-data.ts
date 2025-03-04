import { PrismaClient, ModerationStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Define RentalStatus constants instead of enum
const RentalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
  DISPUTED: 'DISPUTED'
} as const;

async function main() {
  console.log('🌱 Starting to seed test data...');

  // Clean up existing data (optional - comment out if you want to keep existing data)
  console.log('Cleaning up existing test data...');
  await prisma.review.deleteMany({ where: { rating: { gte: 1 } } });
  await prisma.payment.deleteMany({});
  await prisma.rental.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });

  // Create test users
  console.log('Creating test users...');
  
  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      password: await hash('password123', 10),
      isAdmin: true,
      emailVerified: new Date(),
      phoneVerified: true,
      phone: '5551234567',
      idVerified: true,
      idVerificationStatus: 'approved',
      idVerificationDate: new Date(),
    },
  });

  // Equipment owner users
  const owner1 = await prisma.user.upsert({
    where: { email: 'owner1@test.com' },
    update: {},
    create: {
      email: 'owner1@test.com',
      name: 'Sarah Johnson',
      password: await hash('password123', 10),
      emailVerified: new Date(),
      phoneVerified: true,
      phone: '5552345678',
      idVerified: true,
      idVerificationStatus: 'approved',
      idVerificationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      bio: 'Professional photographer with high-end equipment available for rent.',
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: 'owner2@test.com' },
    update: {},
    create: {
      email: 'owner2@test.com',
      name: 'Michael Chen',
      password: await hash('password123', 10),
      emailVerified: new Date(),
      phoneVerified: true,
      phone: '5553456789',
      idVerified: true,
      idVerificationStatus: 'approved',
      idVerificationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      bio: 'Audio engineer with professional sound equipment.',
    },
  });

  const owner3 = await prisma.user.upsert({
    where: { email: 'owner3@test.com' },
    update: {},
    create: {
      email: 'owner3@test.com',
      name: 'Emily Rodriguez',
      password: await hash('password123', 10),
      emailVerified: new Date(),
      phoneVerified: true,
      phone: '5554567890',
      idVerified: false,
      idVerificationStatus: 'pending',
      bio: 'Videographer with a collection of cameras and accessories.',
    },
  });

  // Renter users
  const renter1 = await prisma.user.upsert({
    where: { email: 'renter1@test.com' },
    update: {},
    create: {
      email: 'renter1@test.com',
      name: 'David Wilson',
      password: await hash('password123', 10),
      emailVerified: new Date(),
      phoneVerified: true,
      phone: '5555678901',
      idVerified: true,
      idVerificationStatus: 'approved',
      idVerificationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      bio: 'Freelance filmmaker looking for equipment for short projects.',
    },
  });

  const renter2 = await prisma.user.upsert({
    where: { email: 'renter2@test.com' },
    update: {},
    create: {
      email: 'renter2@test.com',
      name: 'Jessica Lee',
      password: await hash('password123', 10),
      emailVerified: new Date(),
      phoneVerified: false,
      idVerified: false,
      bio: 'Photography student looking to try different equipment.',
    },
  });

  // Create equipment categories
  console.log('Creating equipment categories...');
  const categories = [
    'Photography', 
    'Audio', 
    'Video', 
    'Lighting', 
    'Computers', 
    'Tools', 
    'Outdoor', 
    'Musical Instruments'
  ];

  // Create equipment
  console.log('Creating test equipment...');
  
  // Photography equipment
  const camera1 = await prisma.equipment.create({
    data: {
      title: 'Sony Alpha a7 III Mirrorless Camera',
      description: 'Professional full-frame mirrorless camera with 24.2MP sensor, 4K video, and excellent low-light performance. Includes 28-70mm lens, 2 batteries, charger, and carrying case.',
      condition: 'Excellent',
      category: 'Photography',
      subcategory: 'Cameras',
      tagsJson: JSON.stringify(['mirrorless', 'full-frame', 'sony', '4k']),
      location: 'San Francisco, CA',
      dailyRate: 75,
      weeklyRate: 450,
      securityDeposit: 1000,
      isAvailable: true,
      imagesJson: JSON.stringify([
        '/images/placeholder.svg',
        '/images/placeholder.svg'
      ]),
      moderationStatus: ModerationStatus.APPROVED,
      ownerId: owner1.id,
    },
  });

  const camera2 = await prisma.equipment.create({
    data: {
      title: 'Canon EOS 5D Mark IV DSLR Camera',
      description: 'Professional DSLR with 30.4MP full-frame sensor, 4K video recording, and weather-sealed body. Includes 24-105mm f/4L lens, extra battery, and memory card.',
      condition: 'Good',
      category: 'Photography',
      subcategory: 'Cameras',
      tagsJson: JSON.stringify(['dslr', 'full-frame', 'canon', '4k']),
      location: 'San Francisco, CA',
      dailyRate: 65,
      weeklyRate: 390,
      securityDeposit: 800,
      isAvailable: true,
      imagesJson: JSON.stringify([
        '/images/placeholder.svg',
        '/images/placeholder.svg'
      ]),
      moderationStatus: ModerationStatus.APPROVED,
      ownerId: owner1.id,
    },
  });

  // Audio equipment
  const audioMixer = await prisma.equipment.create({
    data: {
      title: 'Allen & Heath SQ-6 Digital Mixer',
      description: 'Professional 48-channel digital mixer with 24 mic/line inputs, 16 XLR outputs, and intuitive touchscreen interface. Perfect for live sound and studio recording.',
      condition: 'Excellent',
      category: 'Audio',
      subcategory: 'Mixers',
      tagsJson: JSON.stringify(['mixer', 'digital', 'professional', 'studio']),
      location: 'Los Angeles, CA',
      dailyRate: 120,
      weeklyRate: 700,
      securityDeposit: 1500,
      isAvailable: true,
      imagesJson: JSON.stringify([
        '/images/placeholder.svg'
      ]),
      moderationStatus: ModerationStatus.APPROVED,
      ownerId: owner2.id,
    },
  });

  const microphone = await prisma.equipment.create({
    data: {
      title: 'Shure SM7B Vocal Microphone',
      description: 'Industry-standard dynamic microphone for vocals, podcasting, and broadcasting. Includes shock mount and windscreen.',
      condition: 'Like New',
      category: 'Audio',
      subcategory: 'Microphones',
      tagsJson: JSON.stringify(['microphone', 'vocal', 'studio', 'podcast']),
      location: 'Los Angeles, CA',
      dailyRate: 25,
      weeklyRate: 150,
      securityDeposit: 300,
      isAvailable: true,
      imagesJson: JSON.stringify([
        '/images/placeholder.svg'
      ]),
      moderationStatus: ModerationStatus.APPROVED,
      ownerId: owner2.id,
    },
  });

  // Video equipment
  const videoCamera = await prisma.equipment.create({
    data: {
      title: 'Blackmagic Pocket Cinema Camera 6K',
      description: 'Compact cinema camera with 6K resolution, Super 35 sensor, and EF lens mount. Includes 3 batteries, charger, and 256GB CFast card.',
      condition: 'Good',
      category: 'Video',
      subcategory: 'Cameras',
      tagsJson: JSON.stringify(['cinema', '6k', 'blackmagic', 'filmmaking']),
      location: 'New York, NY',
      dailyRate: 95,
      weeklyRate: 570,
      securityDeposit: 1200,
      isAvailable: true,
      imagesJson: JSON.stringify([
        '/images/placeholder.svg'
      ]),
      moderationStatus: ModerationStatus.PENDING,
      ownerId: owner3.id,
    },
  });

  const gimbal = await prisma.equipment.create({
    data: {
      title: 'DJI Ronin-S Gimbal Stabilizer',
      description: 'Professional 3-axis gimbal stabilizer for DSLR and mirrorless cameras. Supports up to 8 lbs and includes follow focus wheel.',
      condition: 'Excellent',
      category: 'Video',
      subcategory: 'Stabilizers',
      tagsJson: JSON.stringify(['gimbal', 'stabilizer', 'dji', 'filmmaking']),
      location: 'New York, NY',
      dailyRate: 45,
      weeklyRate: 270,
      securityDeposit: 500,
      isAvailable: true,
      imagesJson: JSON.stringify([
        '/images/placeholder.svg'
      ]),
      moderationStatus: ModerationStatus.FLAGGED,
      moderationNotes: 'Please provide clearer images of the equipment condition',
      ownerId: owner3.id,
    },
  });

  // Create rentals
  console.log('Creating test rentals...');
  
  // Completed rental with review
  const pastRental1 = await prisma.rental.create({
    data: {
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      status: RentalStatus.COMPLETED,
      totalPrice: 375, // Added required field
      securityDeposit: 1000,
      equipmentId: camera1.id,
      renterId: renter1.id,
      payment: {
        create: {
          amount: 375,
          status: 'COMPLETED',
          securityDepositAmount: 1000,
          securityDepositReturned: true,
          rentalAmount: 375,
          user: {
            connect: {
              id: renter1.id
            }
          }
        }
      },
      review: {
        create: {
          rating: 5,
          comment: 'Excellent camera, in perfect condition. Sarah was very helpful and responsive.',
          authorId: renter1.id, // Changed from userId to authorId
        }
      }
    },
  });

  // Current active rental
  const activeRental = await prisma.rental.create({
    data: {
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: RentalStatus.ACTIVE,
      totalPrice: 325, // Added required field
      securityDeposit: 800,
      equipmentId: camera2.id,
      renterId: renter1.id,
      payment: {
        create: {
          amount: 325,
          status: 'COMPLETED',
          securityDepositAmount: 800,
          securityDepositReturned: false,
          rentalAmount: 325,
          user: {
            connect: {
              id: renter1.id
            }
          }
        }
      }
    },
  });

  // Pending rental
  const pendingRental = await prisma.rental.create({
    data: {
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      status: RentalStatus.PENDING,
      totalPrice: 700, // Added required field
      securityDeposit: 1500,
      equipmentId: audioMixer.id,
      renterId: renter2.id,
      payment: {
        create: {
          amount: 700,
          status: 'PENDING',
          securityDepositAmount: 1500,
          securityDepositReturned: false,
          rentalAmount: 700,
          user: {
            connect: {
              id: renter2.id
            }
          }
        }
      }
    },
  });

  // Completed rental with review
  const pastRental2 = await prisma.rental.create({
    data: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // 23 days ago
      status: RentalStatus.COMPLETED,
      totalPrice: 150, // Added required field
      securityDeposit: 300,
      equipmentId: microphone.id,
      renterId: renter1.id,
      payment: {
        create: {
          amount: 150,
          status: 'COMPLETED',
          securityDepositAmount: 300,
          securityDepositReturned: true,
          rentalAmount: 150,
          user: {
            connect: {
              id: renter1.id
            }
          }
        }
      },
      review: {
        create: {
          rating: 4,
          comment: 'Great microphone, worked perfectly for my podcast recording. Michael was very professional.',
          authorId: renter1.id, // Changed from userId to authorId
        }
      }
    },
  });

  // Canceled rental
  const canceledRental = await prisma.rental.create({
    data: {
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      status: RentalStatus.CANCELED,
      totalPrice: 95, // Added required field
      securityDeposit: 1200,
      equipmentId: videoCamera.id,
      renterId: renter2.id,
      payment: {
        create: {
          amount: 95,
          status: 'CANCELED',
          securityDepositAmount: 1200,
          securityDepositReturned: false,
          rentalAmount: 95,
          user: {
            connect: {
              id: renter2.id
            }
          }
        }
      }
    },
  });

  console.log('✅ Test data seeded successfully!');
  console.log(`
Created:
- 6 Users (1 admin, 3 equipment owners, 2 renters)
- 6 Equipment items
- 5 Rentals (1 active, 1 pending, 2 completed, 1 canceled)
- 2 Reviews

Test accounts:
- Admin: admin@test.com / password123
- Owner: owner1@test.com / password123
- Renter: renter1@test.com / password123
  `);
}

main()
  .catch((e) => {
    console.error('Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 