import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Creates sample equipment listings for beta testing
 */
async function main() {
  console.log('🚀 Creating sample equipment listings for beta testing...');
  
  // First, find the beta owner user
  const betaOwner = await prisma.user.findUnique({
    where: { email: 'beta.owner@test.com' }
  });
  
  if (!betaOwner) {
    console.error('❌ Beta owner user not found. Please run create-beta-testers.js first.');
    process.exit(1);
  }
  
  // Sample equipment data
  const equipmentData = [
    {
      title: 'Professional DSLR Camera',
      description: 'High-end Canon EOS 5D Mark IV DSLR camera with 24-70mm lens. Perfect for professional photography and video production.',
      condition: 'Excellent',
      category: 'Photography',
      subcategory: 'Cameras',
      tagsJson: JSON.stringify(['DSLR', 'Canon', 'Professional', '4K Video']),
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      hourlyRate: 25,
      dailyRate: 100,
      weeklyRate: 500,
      securityDeposit: 500,
      imagesJson: JSON.stringify([
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/camera1.jpg',
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/camera2.jpg'
      ]),
      isVerified: true,
      isAvailable: true,
      moderationStatus: 'APPROVED',
      ownerId: betaOwner.id
    },
    {
      title: 'Portable PA System',
      description: 'Compact and powerful PA system, perfect for small to medium events. Includes 2 speakers, mixer, and microphone.',
      condition: 'Good',
      category: 'Audio',
      subcategory: 'Speakers',
      tagsJson: JSON.stringify(['PA System', 'Speakers', 'Event', 'Sound']),
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      hourlyRate: 30,
      dailyRate: 120,
      weeklyRate: 600,
      securityDeposit: 300,
      imagesJson: JSON.stringify([
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/speaker1.jpg',
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/speaker2.jpg'
      ]),
      isVerified: true,
      isAvailable: true,
      moderationStatus: 'APPROVED',
      ownerId: betaOwner.id
    },
    {
      title: 'Drone with 4K Camera',
      description: 'DJI Mavic Air 2 drone with 4K camera, 3-axis gimbal, and 34-minute flight time. Includes extra batteries and carrying case.',
      condition: 'Like New',
      category: 'Photography',
      subcategory: 'Drones',
      tagsJson: JSON.stringify(['Drone', 'DJI', '4K', 'Aerial']),
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      hourlyRate: 35,
      dailyRate: 150,
      weeklyRate: 750,
      securityDeposit: 800,
      imagesJson: JSON.stringify([
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/drone1.jpg',
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/drone2.jpg'
      ]),
      isVerified: true,
      isAvailable: true,
      moderationStatus: 'APPROVED',
      ownerId: betaOwner.id
    },
    {
      title: 'Professional Lighting Kit',
      description: 'Complete lighting kit for photography and video production. Includes 3 LED panels, stands, and modifiers.',
      condition: 'Good',
      category: 'Photography',
      subcategory: 'Lighting',
      tagsJson: JSON.stringify(['Lighting', 'LED', 'Studio', 'Photography']),
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      hourlyRate: 20,
      dailyRate: 80,
      weeklyRate: 400,
      securityDeposit: 200,
      imagesJson: JSON.stringify([
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/lighting1.jpg',
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/lighting2.jpg'
      ]),
      isVerified: true,
      isAvailable: true,
      moderationStatus: 'APPROVED',
      ownerId: betaOwner.id
    },
    {
      title: 'Electric Guitar with Amp',
      description: 'Fender Stratocaster electric guitar with Marshall amp. Perfect for practice, recording, or small gigs.',
      condition: 'Good',
      category: 'Music',
      subcategory: 'Instruments',
      tagsJson: JSON.stringify(['Guitar', 'Fender', 'Electric', 'Amp']),
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      hourlyRate: 15,
      dailyRate: 60,
      weeklyRate: 300,
      securityDeposit: 400,
      imagesJson: JSON.stringify([
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/guitar1.jpg',
        'https://res.cloudinary.com/dgtqpyphg/image/upload/v1/sample/guitar2.jpg'
      ]),
      isVerified: true,
      isAvailable: true,
      moderationStatus: 'PENDING',
      ownerId: betaOwner.id
    }
  ];
  
  // Create or update each equipment listing
  for (const data of equipmentData) {
    // Check if equipment with this title already exists for this owner
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        title: data.title,
        ownerId: betaOwner.id
      }
    });
    
    if (existingEquipment) {
      // Update existing equipment
      const updatedEquipment = await prisma.equipment.update({
        where: { id: existingEquipment.id },
        data
      });
      console.log(`✅ Updated equipment listing: ${updatedEquipment.title}`);
    } else {
      // Create new equipment listing
      const newEquipment = await prisma.equipment.create({
        data
      });
      console.log(`✅ Created equipment listing: ${newEquipment.title}`);
    }
  }
  
  console.log('\n🎉 Sample equipment listings created successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start your development server with npm run dev');
  console.log('2. Log in with the beta renter account to browse and rent equipment');
  console.log('3. Log in with the beta owner account to manage equipment listings');
  console.log('4. Log in with the beta admin account to moderate listings and manage users');
}

main()
  .catch((e) => {
    console.error('❌ Error creating sample equipment:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 