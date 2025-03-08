import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import readline from 'readline';

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

async function checkCloudinaryConnection() {
  try {
    console.log('Testing Cloudinary connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result.status);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
}

async function listCloudinaryResources() {
  try {
    console.log('Fetching resources from Cloudinary...');
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'equipment',
      max_results: 500
    });
    
    console.log(`Found ${result.resources.length} resources in Cloudinary`);
    return result.resources;
  } catch (error) {
    console.error('Error fetching Cloudinary resources:', error.message);
    return [];
  }
}

async function fixEquipmentImages() {
  console.log('🔍 Starting to fix equipment images...');
  
  // Check Cloudinary connection
  const cloudinaryConnected = await checkCloudinaryConnection();
  if (!cloudinaryConnected) {
    console.log('⚠️ Proceeding without Cloudinary connection. Will use placeholder images only.');
  }
  
  try {
    // Get all equipment
    const allEquipment = await prisma.equipment.findMany();
    console.log(`Found ${allEquipment.length} equipment items in the database`);
    
    // Get Cloudinary resources if connected
    let cloudinaryResources = [];
    if (cloudinaryConnected) {
      cloudinaryResources = await listCloudinaryResources();
    }
    
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
        
        // If we have valid images and they're accessible, keep them
        if (validImages.length > 0) {
          // Test if the first image is accessible
          try {
            const testResponse = await fetch(validImages[0], { method: 'HEAD' });
            if (testResponse.ok) {
              console.log(`- First image is accessible (HTTP ${testResponse.status})`);
              
              // If all images are valid and accessible, skip this equipment
              if (validImages.length === images.length) {
                console.log('- All images are valid and accessible, skipping');
                skippedCount++;
                continue;
              }
            } else {
              console.log(`- First image is not accessible (HTTP ${testResponse.status})`);
            }
          } catch (error) {
            console.log(`- Error testing image accessibility: ${error.message}`);
          }
        }
        
        // Find Cloudinary resources for this equipment
        let equipmentResources = [];
        if (cloudinaryConnected && cloudinaryResources.length > 0) {
          // Look for resources with public_id containing the equipment ID
          equipmentResources = cloudinaryResources.filter(resource => 
            resource.public_id.includes(equipment.id) || 
            resource.public_id.includes(equipment.title.toLowerCase().replace(/\s+/g, '-'))
          );
          
          console.log(`- Found ${equipmentResources.length} Cloudinary resources for this equipment`);
        }
        
        // Prepare new images array
        let newImages = [];
        
        // If we found Cloudinary resources, use them
        if (equipmentResources.length > 0) {
          newImages = equipmentResources.map(resource => resource.secure_url);
          console.log(`- Using ${newImages.length} Cloudinary images`);
        } 
        // If we have valid images, use them
        else if (validImages.length > 0) {
          newImages = validImages;
          console.log(`- Using ${newImages.length} existing valid images`);
        }
        
        // If we still don't have enough images, add placeholders
        if (newImages.length < 7) {
          const category = equipment.category ? equipment.category.toLowerCase() : 'equipment';
          const title = equipment.title ? equipment.title.toLowerCase().replace(/\s+/g, '-') : 'item';
          
          console.log(`- Adding placeholder images (category: ${category}, title: ${title})`);
          
          // Add placeholder images
          for (let i = newImages.length + 1; i <= 7; i++) {
            // Use Unsplash for random equipment images based on category and title
            const placeholderUrl = `https://source.unsplash.com/random/800x600?${category},${title},${i}`;
            newImages.push(placeholderUrl);
          }
        }
        
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
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
          'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac',
          'https://images.unsplash.com/photo-1616423640778-28d1b53229bd',
          'https://images.unsplash.com/photo-1584038877214-9e8f1f65b6e3',
          'https://images.unsplash.com/photo-1581591524425-c7e0978865fc',
          'https://images.unsplash.com/photo-1533425962554-8a1f1b1a3f6a',
          'https://images.unsplash.com/photo-1542567455-cd733f23fbb1'
        ]
      },
      {
        title: 'Electric Lawn Mower',
        description: 'Powerful electric lawn mower, environmentally friendly and easy to use. Perfect for small to medium-sized lawns.',
        category: 'Gardening & Landscaping',
        condition: 'Good',
        location: 'Portland, OR',
        dailyRate: 35,
        securityDeposit: 150,
        images: [
          'https://images.unsplash.com/photo-1589288415563-2b8d3f3a2f4d',
          'https://images.unsplash.com/photo-1590682680695-43b964a3ae17',
          'https://images.unsplash.com/photo-1626378763638-6a7ca21c1c77',
          'https://images.unsplash.com/photo-1558904541-efa843a96f01',
          'https://images.unsplash.com/photo-1599686302990-d8f0da1a3fd7',
          'https://images.unsplash.com/photo-1621149437156-bca51e9a7dbe',
          'https://images.unsplash.com/photo-1592420114272-8e29c11a9d4a'
        ]
      },
      {
        title: 'Portable PA System',
        description: 'Complete portable PA system with speakers, mixer, and microphones. Perfect for small events and presentations.',
        category: 'Audio Equipment',
        condition: 'Like New',
        location: 'Austin, TX',
        dailyRate: 60,
        securityDeposit: 300,
        images: [
          'https://images.unsplash.com/photo-1520170350707-b2da59970118',
          'https://images.unsplash.com/photo-1547394765-185e1e68f34e',
          'https://images.unsplash.com/photo-1598653222000-6b7b7a552625',
          'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6',
          'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742',
          'https://images.unsplash.com/photo-1570752321219-41822a21a761',
          'https://images.unsplash.com/photo-1545167622-3a6ac756afa4'
        ]
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
          where: { role: 'USER' },
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