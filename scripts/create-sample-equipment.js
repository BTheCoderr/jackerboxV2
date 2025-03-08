import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Sample equipment data with realistic fields
const sampleEquipment = [
  {
    title: 'Professional DSLR Camera Kit',
    description: 'Complete professional photography kit including a Canon EOS 5D Mark IV DSLR camera, three premium lenses (24-70mm f/2.8, 70-200mm f/2.8, and 50mm f/1.4), two extra batteries, memory cards, and a sturdy carrying case. Perfect for professional photoshoots, events, and high-quality video production.',
    category: 'Photography & Video',
    subcategory: 'Cameras',
    condition: 'Excellent',
    location: 'San Francisco, CA',
    hourlyRate: 25,
    dailyRate: 75,
    weeklyRate: 350,
    securityDeposit: 500,
    tags: ['Canon', 'DSLR', 'Professional', 'Photography', 'Video', '4K', 'Full Frame'],
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1584038877214-9e8f1f65b6e3?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1533425962554-8a1f1b1a3f6a?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1542567455-cd733f23fbb1?fit=crop&w=800&h=600'
    ]
  },
  {
    title: 'Electric Lawn Mower - Self-Propelled',
    description: 'Environmentally friendly electric lawn mower with self-propelled feature. Includes a 21-inch cutting deck, mulching capability, and adjustable cutting height. Battery provides up to 60 minutes of runtime on a single charge. Perfect for small to medium-sized lawns. Comes with charger and grass collection bag.',
    category: 'Gardening & Landscaping',
    subcategory: 'Lawn Care',
    condition: 'Good',
    location: 'Portland, OR',
    hourlyRate: null,
    dailyRate: 35,
    weeklyRate: 150,
    securityDeposit: 150,
    tags: ['Electric', 'Lawn Mower', 'Self-Propelled', 'Eco-Friendly', 'Gardening', 'Outdoor'],
    images: [
      'https://images.unsplash.com/photo-1589288415563-2b8d3f3a2f4d?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1626378763638-6a7ca21c1c77?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1558904541-efa843a96f01?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1599686302990-d8f0da1a3fd7?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1621149437156-bca51e9a7dbe?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1592420114272-8e29c11a9d4a?fit=crop&w=800&h=600'
    ]
  },
  {
    title: 'Portable PA System with Wireless Mics',
    description: 'Complete portable PA system with 1000W output, 12-inch speakers, built-in mixer, Bluetooth connectivity, and two wireless microphones. Perfect for small to medium events, presentations, and performances. Includes speaker stands, all necessary cables, and a carrying case for easy transport.',
    category: 'Audio Equipment',
    subcategory: 'PA Systems',
    condition: 'Like New',
    location: 'Austin, TX',
    hourlyRate: 20,
    dailyRate: 60,
    weeklyRate: 250,
    securityDeposit: 300,
    tags: ['PA System', 'Speakers', 'Wireless', 'Audio', 'Events', 'Microphones', 'Bluetooth'],
    images: [
      'https://images.unsplash.com/photo-1520170350707-b2da59970118?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1547394765-185e1e68f34e?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1570752321219-41822a21a761?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?fit=crop&w=800&h=600'
    ]
  },
  {
    title: 'Cordless Drill Set with 100+ Accessories',
    description: 'Professional-grade 20V cordless drill set with hammer function, 2 lithium-ion batteries, fast charger, and over 100 accessories including drill bits, screwdriver bits, and socket adapters. Features variable speed control, LED work light, and ergonomic grip. Perfect for home improvement projects, furniture assembly, and general repairs.',
    category: 'Power Tools',
    subcategory: 'Drills',
    condition: 'Good',
    location: 'Chicago, IL',
    hourlyRate: 10,
    dailyRate: 25,
    weeklyRate: 100,
    securityDeposit: 100,
    tags: ['Drill', 'Cordless', 'Power Tools', 'DIY', 'Home Improvement', 'Accessories'],
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1620230874645-0d85a0a7a9e6?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1590479773265-7464e5d48118?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1586864387789-628af9feed72?fit=crop&w=800&h=600'
    ]
  },
  {
    title: '4-Person Camping Set with Tent and Gear',
    description: 'Complete camping set for 4 people including a waterproof tent, 4 sleeping bags, camping stove, cookware, lantern, and portable chairs. The tent features easy setup, mesh windows for ventilation, and a rainfly for weather protection. Perfect for weekend getaways, family camping trips, and outdoor adventures.',
    category: 'Camping & Outdoor',
    subcategory: 'Camping Gear',
    condition: 'Very Good',
    location: 'Denver, CO',
    hourlyRate: null,
    dailyRate: 45,
    weeklyRate: 200,
    securityDeposit: 150,
    tags: ['Camping', 'Tent', 'Outdoor', 'Sleeping Bags', 'Hiking', 'Adventure', 'Family'],
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1525811902-f2342640856e?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1563299796-17596ed6b017?fit=crop&w=800&h=600'
    ]
  },
  {
    title: 'DJI Drone with 4K Camera',
    description: 'High-end DJI drone with 4K camera, 3-axis gimbal stabilization, and 30-minute flight time. Features obstacle avoidance, return-to-home function, and intelligent flight modes. Includes extra batteries, propellers, carrying case, and remote controller with smartphone mount. Perfect for aerial photography, videography, and recreational flying.',
    category: 'Photography & Video',
    subcategory: 'Drones',
    condition: 'Excellent',
    location: 'Los Angeles, CA',
    hourlyRate: 30,
    dailyRate: 80,
    weeklyRate: 400,
    securityDeposit: 500,
    tags: ['Drone', 'DJI', '4K', 'Aerial', 'Photography', 'Video', 'Flying'],
    images: [
      'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1579829366248-204fe8413f31?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1524143986875-3b098d911b80?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1506947411487-a56738267384?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1533310266094-8898a03807dd?fit=crop&w=800&h=600'
    ]
  },
  {
    title: 'Electric Guitar with Amp and Accessories',
    description: 'Fender Stratocaster electric guitar package including a 40W amplifier, gig bag, tuner, strap, extra strings, and instructional materials. The guitar features a maple neck, rosewood fingerboard, and three single-coil pickups. Perfect for beginners, practice sessions, small performances, and recording.',
    category: 'Music',
    subcategory: 'Guitars',
    condition: 'Good',
    location: 'Nashville, TN',
    hourlyRate: 15,
    dailyRate: 40,
    weeklyRate: 180,
    securityDeposit: 200,
    tags: ['Guitar', 'Electric', 'Fender', 'Amplifier', 'Music', 'Instrument', 'Stratocaster'],
    images: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1514649923863-ceaf75b7ec00?fit=crop&w=800&h=600'
    ]
  },
  {
    title: 'Party Lighting and Sound System',
    description: 'Complete party setup with DJ lights, sound system, and fog machine. Includes two 12-inch powered speakers (1000W total), mixer, microphone, LED par lights, moving head lights, laser effects, and a programmable fog machine. Perfect for house parties, small events, and DJ performances.',
    category: 'Party & Events',
    subcategory: 'DJ Equipment',
    condition: 'Very Good',
    location: 'Miami, FL',
    hourlyRate: 35,
    dailyRate: 100,
    weeklyRate: 450,
    securityDeposit: 300,
    tags: ['Party', 'DJ', 'Lighting', 'Sound System', 'Events', 'Speakers', 'Lights'],
    images: [
      'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?fit=crop&w=800&h=600'
    ]
  },
  {
    title: 'MacBook Pro 16" with Software Suite',
    description: 'Latest model MacBook Pro 16" with M1 Pro chip, 32GB RAM, 1TB SSD, and pre-installed software including Adobe Creative Cloud, Final Cut Pro, Logic Pro, and Microsoft Office. Perfect for video editing, graphic design, music production, and professional work. Includes charger, protective case, and external hard drive for backups.',
    category: 'Electronics',
    subcategory: 'Laptops',
    condition: 'Like New',
    location: 'New York, NY',
    hourlyRate: 20,
    dailyRate: 65,
    weeklyRate: 300,
    securityDeposit: 800,
    tags: ['MacBook', 'Apple', 'Laptop', 'Computer', 'Adobe', 'Final Cut', 'Professional'],
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1537498425277-c283d32ef9db?fit=crop&w=800&h=600'
    ]
  },
  {
    title: 'Heavy Duty Floor Buffer and Polisher',
    description: 'Commercial-grade floor buffer and polisher with 20-inch cleaning path, variable speed control, and 1.5 HP motor. Includes various pads for different floor types including hardwood, tile, concrete, and marble. Perfect for deep cleaning, polishing, and maintaining large floor areas in homes, offices, or commercial spaces.',
    category: 'Cleaning Equipment',
    subcategory: 'Floor Care',
    condition: 'Good',
    location: 'Seattle, WA',
    hourlyRate: null,
    dailyRate: 50,
    weeklyRate: 200,
    securityDeposit: 150,
    tags: ['Buffer', 'Polisher', 'Floor', 'Cleaning', 'Commercial', 'Hardwood', 'Tile'],
    images: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1527515673510-8aa78ce21f9b?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?fit=crop&w=800&h=600',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?fit=crop&w=800&h=600'
    ]
  }
];

async function createSampleEquipment() {
  console.log('🏗️ Creating sample equipment...');
  
  try {
    // Get a user to be the owner of the equipment
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!user) {
      console.log('❌ No users found in the database. Please create a user first.');
      return;
    }
    
    console.log(`Using user ${user.name || user.email} (ID: ${user.id}) as the owner`);
    
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Create each sample equipment
    for (const sample of sampleEquipment) {
      try {
        // Check if equipment with this title already exists
        const existing = await prisma.equipment.findFirst({
          where: { title: sample.title }
        });
        
        if (existing) {
          console.log(`- Sample "${sample.title}" already exists, updating...`);
          
          // Update existing equipment
          await prisma.equipment.update({
            where: { id: existing.id },
            data: {
              description: sample.description,
              condition: sample.condition,
              category: sample.category,
              subcategory: sample.subcategory,
              location: sample.location,
              hourlyRate: sample.hourlyRate,
              dailyRate: sample.dailyRate,
              weeklyRate: sample.weeklyRate,
              securityDeposit: sample.securityDeposit,
              imagesJson: JSON.stringify(sample.images),
              tagsJson: JSON.stringify(sample.tags),
              isVerified: true,
              isAvailable: true,
              moderationStatus: 'APPROVED'
            }
          });
          
          updatedCount++;
          console.log(`✅ Updated "${sample.title}"`);
        } else {
          console.log(`- Creating new sample: ${sample.title}`);
          
          // Create new equipment
          await prisma.equipment.create({
            data: {
              title: sample.title,
              description: sample.description,
              condition: sample.condition,
              category: sample.category,
              subcategory: sample.subcategory || null,
              tagsJson: JSON.stringify(sample.tags),
              location: sample.location,
              hourlyRate: sample.hourlyRate,
              dailyRate: sample.dailyRate,
              weeklyRate: sample.weeklyRate,
              securityDeposit: sample.securityDeposit,
              imagesJson: JSON.stringify(sample.images),
              isVerified: true,
              isAvailable: true,
              ownerId: user.id,
              moderationStatus: 'APPROVED'
            }
          });
          
          createdCount++;
          console.log(`✅ Created "${sample.title}"`);
        }
      } catch (error) {
        console.error(`❌ Error processing "${sample.title}": ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Created: ${createdCount}`);
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total: ${sampleEquipment.length}`);
    
    console.log('\n✨ Sample equipment creation complete!');
    console.log('You can now browse the equipment in the app.');
  } catch (error) {
    console.error('Error creating sample equipment:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Ask for confirmation before creating sample data
async function main() {
  console.log('This script will create sample equipment data in your database.');
  console.log('It will create or update the following equipment:');
  
  sampleEquipment.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title} (${item.category})`);
  });
  
  const confirm = await question('\nDo you want to continue? (y/n): ');
  
  if (confirm.toLowerCase() === 'y') {
    await createSampleEquipment();
  } else {
    console.log('Operation cancelled.');
    rl.close();
  }
}

// Run the script
main(); 