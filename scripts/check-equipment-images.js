import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

async function checkEquipmentImages() {
  try {
    console.log('Checking equipment images in the database...');
    
    // Get all equipment
    const equipment = await prisma.equipment.findMany({
      select: {
        id: true,
        title: true,
        imagesJson: true,
        category: true
      }
    });
    
    console.log(`Found ${equipment.length} equipment items`);
    
    // Check each equipment's images
    for (const item of equipment) {
      let images = [];
      try {
        images = JSON.parse(item.imagesJson);
      } catch (error) {
        console.error(`Error parsing images for ${item.title}: ${error.message}`);
        continue;
      }
      
      console.log(`\n${item.title} (${item.category}):`);
      console.log(`- ID: ${item.id}`);
      console.log(`- Images: ${images.length}`);
      
      if (images.length > 0) {
        console.log('- First image URL:', images[0]);
      } else {
        console.log('- No images found');
      }
    }
    
    console.log('\nCheck complete!');
  } catch (error) {
    console.error('Error checking equipment images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkEquipmentImages(); 