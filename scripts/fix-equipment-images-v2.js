import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import readline from 'readline';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Sample equipment images by category
const sampleImagesByCategory = {
  'Photography & Video': [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1584038877214-9e8f1f65b6e3?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1533425962554-8a1f1b1a3f6a?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1542567455-cd733f23fbb1?fit=crop&w=800&h=600'
  ],
  'Audio Equipment': [
    'https://images.unsplash.com/photo-1520170350707-b2da59970118?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1547394765-185e1e68f34e?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1570752321219-41822a21a761?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?fit=crop&w=800&h=600'
  ],
  'Gardening & Landscaping': [
    'https://images.unsplash.com/photo-1589288415563-2b8d3f3a2f4d?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1626378763638-6a7ca21c1c77?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1599686302990-d8f0da1a3fd7?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1621149437156-bca51e9a7dbe?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1592420114272-8e29c11a9d4a?fit=crop&w=800&h=600'
  ],
  'Power Tools': [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1620230874645-0d85a0a7a9e6?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1590479773265-7464e5d48118?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1586864387789-628af9feed72?fit=crop&w=800&h=600'
  ],
  'Camping & Outdoor': [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1525811902-f2342640856e?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1563299796-17596ed6b017?fit=crop&w=800&h=600'
  ],
  'Electronics': [
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1588508065123-287b28e013da?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1601524909162-ae8725290836?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?fit=crop&w=800&h=600'
  ],
  'Music': [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1514649923863-ceaf75b7ec00?fit=crop&w=800&h=600'
  ],
  'Party & Events': [
    'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?fit=crop&w=800&h=600'
  ]
};

// Default images for any category not in the sample list
const defaultImages = [
  'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1563453392212-326f5e854473?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1493946740644-2d8a1f1a6aff?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?fit=crop&w=800&h=600'
];

// Check if an image URL is accessible
async function isImageAccessible(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok;
  } catch (error) {
    console.log(`Error checking image accessibility: ${error.message}`);
    return false;
  }
}

// Get sample images for a specific category
function getSampleImagesForCategory(category) {
  const normalizedCategory = category ? category.trim() : '';
  
  // Check if we have sample images for this category
  if (normalizedCategory && sampleImagesByCategory[normalizedCategory]) {
    return sampleImagesByCategory[normalizedCategory];
  }
  
  // If not, return default images
  return defaultImages;
}

// Generate a unique set of images for an equipment item
function generateUniqueImages(category, title, id) {
  const baseImages = getSampleImagesForCategory(category);
  
  // Add some randomization based on the equipment ID and title
  const seed = id ? id.substring(0, 8) : '';
  const titleHash = title ? title.length : 0;
  
  // Shuffle the array based on the seed
  const shuffledImages = [...baseImages].sort(() => {
    // Use a deterministic "random" based on the seed and title
    const randomFactor = (seed.charCodeAt(0) || 0) + titleHash;
    return 0.5 - Math.sin(randomFactor);
  });
  
  // Return at least 7 images, repeating if necessary
  const result = [];
  while (result.length < 7) {
    result.push(...shuffledImages);
  }
  
  return result.slice(0, 7);
}

async function fixEquipmentImages() {
  console.log('🔍 Starting to fix equipment images...');
  
  try {
    // Get all equipment
    const allEquipment = await prisma.equipment.findMany();
    console.log(`Found ${allEquipment.length} equipment items in the database`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each equipment item
    for (const equipment of allEquipment) {
      try {
        console.log(`\nProcessing equipment: ${equipment.title} (ID: ${equipment.id})`);
        
        let images = [];
        
        // Try to parse the existing imagesJson
        try {
          if (equipment.imagesJson) {
            images = JSON.parse(equipment.imagesJson);
            console.log(`- Current images: ${images.length}`);
          } else {
            console.log(`- No images found (imagesJson is ${equipment.imagesJson})`);
          }
        } catch (e) {
          console.log(`- Error parsing imagesJson: ${e.message}`);
          images = [];
        }
        
        // Check if images are valid URLs
        const validImages = images.filter(url => 
          url && 
          typeof url === 'string' && 
          !url.startsWith('blob:') && 
          !url.startsWith('data:') &&
          (url.startsWith('http://') || url.startsWith('https://'))
        );
        
        console.log(`- Valid images: ${validImages.length} out of ${images.length}`);
        
        // If we have valid images, check if they're accessible
        let accessibleImages = [];
        if (validImages.length > 0) {
          console.log('- Testing image accessibility...');
          
          for (const url of validImages) {
            const isAccessible = await isImageAccessible(url);
            if (isAccessible) {
              accessibleImages.push(url);
            }
          }
          
          console.log(`- Accessible images: ${accessibleImages.length} out of ${validImages.length}`);
        }
        
        // If we have enough accessible images, skip this equipment
        if (accessibleImages.length >= 7) {
          console.log('- Equipment has enough accessible images, skipping');
          skippedCount++;
          continue;
        }
        
        // Generate new images based on category and title
        console.log(`- Generating new images for category: ${equipment.category}`);
        const newImages = generateUniqueImages(equipment.category, equipment.title, equipment.id);
        
        // Update the equipment with new images
        await prisma.equipment.update({
          where: { id: equipment.id },
          data: { imagesJson: JSON.stringify(newImages) }
        });
        
        console.log(`✅ Updated equipment with ${newImages.length} images`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error processing equipment ${equipment.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Total equipment items: ${allEquipment.length}`);
    console.log(`- Updated with new images: ${updatedCount}`);
    console.log(`- Skipped (already valid): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
    // Ask if user wants to create sample equipment with images
    const createSample = await question('\nDo you want to create sample equipment with test images? (y/n): ');
    
    if (createSample.toLowerCase() === 'y') {
      await createSampleEquipment();
    }
    
    console.log('\n✨ Done! The equipment images have been fixed.');
  } catch (error) {
    console.error('Error fixing equipment images:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

async function createSampleEquipment() {
  console.log('\n🏗️ Creating sample equipment...');
  
  try {
    // Sample equipment data
    const sampleEquipment = [
      {
        title: 'Professional DSLR Camera',
        description: 'High-end DSLR camera with multiple lenses, perfect for professional photography and video production.',
        category: 'Photography & Video',
        condition: 'Excellent',
        location: 'San Francisco, CA',
        dailyRate: 75,
        securityDeposit: 500,
        images: getSampleImagesForCategory('Photography & Video')
      },
      {
        title: 'Electric Lawn Mower',
        description: 'Powerful electric lawn mower, environmentally friendly and easy to use. Perfect for small to medium-sized lawns.',
        category: 'Gardening & Landscaping',
        condition: 'Good',
        location: 'Portland, OR',
        dailyRate: 35,
        securityDeposit: 150,
        images: getSampleImagesForCategory('Gardening & Landscaping')
      },
      {
        title: 'Portable PA System',
        description: 'Complete portable PA system with speakers, mixer, and microphones. Perfect for small events and presentations.',
        category: 'Audio Equipment',
        condition: 'Like New',
        location: 'Austin, TX',
        dailyRate: 60,
        securityDeposit: 300,
        images: getSampleImagesForCategory('Audio Equipment')
      },
      {
        title: 'Cordless Drill Set',
        description: 'Professional-grade cordless drill set with multiple bits and attachments. Includes two batteries and charger.',
        category: 'Power Tools',
        condition: 'Good',
        location: 'Chicago, IL',
        dailyRate: 25,
        securityDeposit: 100,
        images: getSampleImagesForCategory('Power Tools')
      }
    ];
    
    // Create each sample equipment
    for (const sample of sampleEquipment) {
      // Check if equipment with this title already exists
      const existing = await prisma.equipment.findFirst({
        where: { title: sample.title }
      });
      
      if (existing) {
        console.log(`- Sample "${sample.title}" already exists, updating images`);
        
        // Update existing equipment with new images
        await prisma.equipment.update({
          where: { id: existing.id },
          data: { imagesJson: JSON.stringify(sample.images) }
        });
      } else {
        console.log(`- Creating new sample: ${sample.title}`);
        
        // Get a random user to be the owner
        const randomUser = await prisma.user.findFirst({
          orderBy: { createdAt: 'desc' }
        });
        
        if (!randomUser) {
          console.log('- No users found to assign as owner, skipping');
          continue;
        }
        
        // Create new equipment
        await prisma.equipment.create({
          data: {
            title: sample.title,
            description: sample.description,
            category: sample.category,
            condition: sample.condition,
            location: sample.location,
            dailyRate: sample.dailyRate,
            securityDeposit: sample.securityDeposit,
            imagesJson: JSON.stringify(sample.images),
            isVerified: true,
            isActive: true,
            ownerId: randomUser.id,
            moderationStatus: 'APPROVED',
            tagsJson: JSON.stringify([sample.category, sample.condition, 'Sample'])
          }
        });
      }
    }
    
    console.log('✅ Sample equipment created successfully');
  } catch (error) {
    console.error('Error creating sample equipment:', error);
  }
}

// Run the script
fixEquipmentImages(); 