import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function fixEquipmentImages() {
  console.log('Starting to fix equipment images...');
  
  try {
    // Get all equipment
    const allEquipment = await prisma.equipment.findMany();
    console.log(`Found ${allEquipment.length} equipment items`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each equipment item
    for (const equipment of allEquipment) {
      try {
        let images = [];
        
        // Try to parse the existing imagesJson
        try {
          images = JSON.parse(equipment.imagesJson);
        } catch (e) {
          console.log(`Error parsing imagesJson for equipment ${equipment.id}: ${e.message}`);
          images = [];
        }
        
        // Check if images are valid URLs (not blob: or data: URLs)
        const validImages = images.filter(url => 
          url && 
          typeof url === 'string' && 
          !url.startsWith('blob:') && 
          !url.startsWith('data:') &&
          (url.startsWith('http://') || url.startsWith('https://'))
        );
        
        // If we lost images, replace with placeholder images
        if (validImages.length < images.length) {
          console.log(`Equipment ${equipment.id} (${equipment.title}) has ${images.length} images, but only ${validImages.length} are valid`);
          
          // Generate placeholder images based on the equipment category
          const placeholderImages = [];
          const category = equipment.category.toLowerCase();
          
          // Add category-specific placeholder images
          for (let i = 1; i <= 7; i++) {
            // Try to use category-specific placeholders if available
            placeholderImages.push(`https://source.unsplash.com/random/800x600?${category},equipment,${i}`);
          }
          
          // Update the equipment with placeholder images
          await prisma.equipment.update({
            where: { id: equipment.id },
            data: { imagesJson: JSON.stringify(placeholderImages) }
          });
          
          console.log(`✅ Updated equipment ${equipment.id} with placeholder images`);
          updatedCount++;
        } else if (validImages.length === 0) {
          // If no valid images at all, add placeholders
          const placeholderImages = [];
          const category = equipment.category.toLowerCase();
          
          // Add category-specific placeholder images
          for (let i = 1; i <= 7; i++) {
            placeholderImages.push(`https://source.unsplash.com/random/800x600?${category},equipment,${i}`);
          }
          
          // Update the equipment with placeholder images
          await prisma.equipment.update({
            where: { id: equipment.id },
            data: { imagesJson: JSON.stringify(placeholderImages) }
          });
          
          console.log(`✅ Added placeholder images to equipment ${equipment.id} with no images`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error processing equipment ${equipment.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\nSummary:');
    console.log(`- Total equipment items: ${allEquipment.length}`);
    console.log(`- Updated with placeholder images: ${updatedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log('\nDone!');
  } catch (error) {
    console.error('Error fixing equipment images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEquipmentImages(); 