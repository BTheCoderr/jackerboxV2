import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.equipment.deleteMany();
  await prisma.user.deleteMany();

  // Create test users with different roles
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@jackerbox.com",
      password: await hash("admin123", 10),
      isAdmin: true,
      emailVerified: new Date(),
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);

  const rentalProvider = await prisma.user.create({
    data: {
      email: 'provider@jackerbox.com',
      name: 'Equipment Provider',
      password: await hash('provider123', 12),
      emailVerified: new Date(),
      idVerified: true,
      userType: 'PROVIDER',
      stripeConnectAccountId: 'acct_test_provider'
    }
  });

  const regularUser = await prisma.user.create({
    data: {
      name: "Regular User",
      email: "user@jackerbox.com",
      password: await hash("user123", 10),
      emailVerified: new Date(),
    },
  });

  console.log(`Created regular user: ${regularUser.email}`);

  // Create test equipment
  const equipmentData = [
    {
      title: 'Professional DSLR Camera Kit',
      description: 'Complete Canon EOS R5 kit with lenses and accessories',
      category: 'PHOTOGRAPHY',
      subcategory: 'Cameras',
      condition: 'EXCELLENT',
      location: 'San Francisco, CA',
      hourlyRate: 75,
      dailyRate: 200,
      weeklyRate: 800,
      ownerId: rentalProvider.id,
      isAvailable: true,
      imagesJson: JSON.stringify([
        'https://example.com/camera1.jpg',
        'https://example.com/camera2.jpg'
      ]),
      tagsJson: JSON.stringify(['Canon', 'DSLR', 'Professional', '4K']),
      latitude: 37.7749,
      longitude: -122.4194
    },
    {
      title: 'Construction Grade Power Tools Set',
      description: 'DeWalt power tool set including drill, saw, and sander',
      category: 'TOOLS',
      subcategory: 'Power Tools',
      condition: 'GOOD',
      location: 'Los Angeles, CA',
      hourlyRate: 45,
      dailyRate: 120,
      weeklyRate: 500,
      ownerId: rentalProvider.id,
      isAvailable: true,
      imagesJson: JSON.stringify([
        'https://example.com/tools1.jpg',
        'https://example.com/tools2.jpg'
      ]),
      tagsJson: JSON.stringify(['DeWalt', 'Power Tools', 'Construction']),
      latitude: 34.0522,
      longitude: -118.2437
    },
    {
      title: 'DJ Equipment Package',
      description: 'Complete DJ setup with mixer, speakers, and lighting',
      category: 'AUDIO',
      subcategory: 'DJ Equipment',
      condition: 'NEW',
      location: 'Miami, FL',
      hourlyRate: 100,
      dailyRate: 300,
      weeklyRate: 1000,
      ownerId: rentalProvider.id,
      isAvailable: true,
      imagesJson: JSON.stringify([
        'https://example.com/dj1.jpg',
        'https://example.com/dj2.jpg'
      ]),
      tagsJson: JSON.stringify(['Pioneer', 'DJ', 'Professional Audio']),
      latitude: 25.7617,
      longitude: -80.1918
    }
  ];

  for (const equipment of equipmentData) {
    await prisma.equipment.create({ data: equipment });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 