import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

async function checkImageLoading() {
  try {
    console.log('🔍 Checking image loading for equipment...');
    
    // Get all equipment
    const equipment = await prisma.equipment.findMany({
      select: {
        id: true,
        title: true,
        imagesJson: true
      }
    });
    
    console.log(`Found ${equipment.length} equipment items to check`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Check each equipment's images
    for (const item of equipment) {
      console.log(`\nChecking images for: ${item.title}`);
      
      let images = [];
      try {
        images = JSON.parse(item.imagesJson);
      } catch (error) {
        console.error(`Error parsing images for ${item.title}: ${error.message}`);
        failureCount++;
        continue;
      }
      
      if (images.length === 0) {
        console.log('❌ No images found');
        failureCount++;
        continue;
      }
      
      // Check if the first image is accessible
      const firstImage = images[0];
      console.log(`Testing image: ${firstImage}`);
      
      try {
        const response = await fetch(firstImage, { method: 'HEAD', timeout: 5000 });
        if (response.ok) {
          console.log('✅ Image is accessible');
          successCount++;
        } else {
          console.log(`❌ Image is not accessible (Status: ${response.status})`);
          failureCount++;
        }
      } catch (error) {
        console.error(`❌ Error accessing image: ${error.message}`);
        failureCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Success: ${successCount}`);
    console.log(`- Failure: ${failureCount}`);
    console.log(`- Total: ${equipment.length}`);
    
    if (failureCount > 0) {
      console.log('\n⚠️ Some images are not loading correctly. Consider updating them with direct Unsplash URLs.');
    } else {
      console.log('\n✨ All images are loading correctly!');
    }
  } catch (error) {
    console.error('Error checking image loading:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkImageLoading(); 