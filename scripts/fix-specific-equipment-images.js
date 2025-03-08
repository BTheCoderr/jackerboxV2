import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Specific equipment IDs to fix
const equipmentToFix = [
  'cm80n1c5b0001l2032z5fpvju', // Craftsman Leaf Blower
  'cm80rki640003ulofh4yzah3h'  // Electric Lawn Mower - Self-Propelled
];

// Replacement images for gardening equipment
const gardeningImages = [
  'https://images.unsplash.com/photo-1600702845206-f2416c0aae6c?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1598902108854-10e335adac99?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1599686302990-d8f0da1a3fd7?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1621149437156-bca51e9a7dbe?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1592420114272-8e29c11a9d4a?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1558904541-efa843a96f01?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?fit=crop&w=800&h=600'
];

async function fixSpecificEquipmentImages() {
  try {
    console.log('🔧 Fixing specific equipment images...');
    
    for (const equipmentId of equipmentToFix) {
      // Get the equipment
      const equipment = await prisma.equipment.findUnique({
        where: { id: equipmentId },
        select: {
          id: true,
          title: true
        }
      });
      
      if (!equipment) {
        console.log(`❌ Equipment with ID ${equipmentId} not found`);
        continue;
      }
      
      console.log(`\nFixing images for: ${equipment.title} (${equipment.id})`);
      
      // Add a unique parameter to each image URL to make them unique for this equipment
      const uniqueImages = gardeningImages.map((img, index) => {
        const uniqueParam = `&unique=${equipment.id.substring(0, 8)}-${index}-fixed`;
        return img.includes('?') ? `${img}${uniqueParam}` : `${img}?${uniqueParam.substring(1)}`;
      });
      
      // Update the equipment with new images
      await prisma.equipment.update({
        where: { id: equipment.id },
        data: {
          imagesJson: JSON.stringify(uniqueImages)
        }
      });
      
      console.log(`✅ Updated images for "${equipment.title}"`);
    }
    
    console.log('\n✨ Fixed specific equipment images successfully!');
  } catch (error) {
    console.error('Error fixing equipment images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixSpecificEquipmentImages(); 