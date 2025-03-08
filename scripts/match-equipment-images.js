import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Category-specific image collections with high-quality, relevant images
const categoryImages = {
  'Photography & Video': [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?fit=crop&w=800&h=600', // Camera
    'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?fit=crop&w=800&h=600', // Lens
    'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?fit=crop&w=800&h=600', // Camera setup
    'https://images.unsplash.com/photo-1584038877214-9e8f1f65b6e3?fit=crop&w=800&h=600', // Filming
    'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?fit=crop&w=800&h=600', // Studio
    'https://images.unsplash.com/photo-1533425962554-8a1f1b1a3f6a?fit=crop&w=800&h=600', // Camera gear
    'https://images.unsplash.com/photo-1542567455-cd733f23fbb1?fit=crop&w=800&h=600'  // Photography
  ],
  'Audio Equipment': [
    'https://images.unsplash.com/photo-1520170350707-b2da59970118?fit=crop&w=800&h=600', // Microphone
    'https://images.unsplash.com/photo-1547394765-185e1e68f34e?fit=crop&w=800&h=600', // Audio mixer
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?fit=crop&w=800&h=600', // Speakers
    'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?fit=crop&w=800&h=600', // Headphones
    'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?fit=crop&w=800&h=600', // Recording
    'https://images.unsplash.com/photo-1570752321219-41822a21a761?fit=crop&w=800&h=600', // Audio setup
    'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?fit=crop&w=800&h=600'  // Sound system
  ],
  'Gardening & Landscaping': [
    'https://images.unsplash.com/photo-1600702845206-f2416c0aae6c?fit=crop&w=800&h=600', // Lawn mower
    'https://images.unsplash.com/photo-1598902108854-10e335adac99?fit=crop&w=800&h=600', // Leaf blower
    'https://images.unsplash.com/photo-1599686302990-d8f0da1a3fd7?fit=crop&w=800&h=600', // Garden tools
    'https://images.unsplash.com/photo-1621149437156-bca51e9a7dbe?fit=crop&w=800&h=600', // Gardening
    'https://images.unsplash.com/photo-1592420114272-8e29c11a9d4a?fit=crop&w=800&h=600', // Landscaping
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?fit=crop&w=800&h=600', // Hedge trimmer
    'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?fit=crop&w=800&h=600'  // Garden equipment
  ],
  'Power Tools': [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?fit=crop&w=800&h=600', // Drill
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?fit=crop&w=800&h=600', // Power tools
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?fit=crop&w=800&h=600', // Saw
    'https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?fit=crop&w=800&h=600', // Tools
    'https://images.unsplash.com/photo-1620230874645-0d85a0a7a9e6?fit=crop&w=800&h=600', // Workshop
    'https://images.unsplash.com/photo-1590479773265-7464e5d48118?fit=crop&w=800&h=600', // Tool set
    'https://images.unsplash.com/photo-1586864387789-628af9feed72?fit=crop&w=800&h=600'  // Construction
  ],
  'Camping & Outdoor': [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?fit=crop&w=800&h=600', // Camping
    'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?fit=crop&w=800&h=600', // Tent
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?fit=crop&w=800&h=600', // Camping gear
    'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?fit=crop&w=800&h=600', // Outdoor
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?fit=crop&w=800&h=600', // Camping setup
    'https://images.unsplash.com/photo-1525811902-f2342640856e?fit=crop&w=800&h=600', // Camping equipment
    'https://images.unsplash.com/photo-1563299796-17596ed6b017?fit=crop&w=800&h=600'  // Outdoor gear
  ],
  'Electronics': [
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?fit=crop&w=800&h=600', // Laptop
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?fit=crop&w=800&h=600', // Computer
    'https://images.unsplash.com/photo-1588508065123-287b28e013da?fit=crop&w=800&h=600', // Electronics
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?fit=crop&w=800&h=600', // Tech
    'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?fit=crop&w=800&h=600', // Gadgets
    'https://images.unsplash.com/photo-1601524909162-ae8725290836?fit=crop&w=800&h=600', // Devices
    'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?fit=crop&w=800&h=600'  // Electronic equipment
  ],
  'Music': [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?fit=crop&w=800&h=600', // Guitar
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?fit=crop&w=800&h=600', // Piano
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?fit=crop&w=800&h=600', // Drums
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?fit=crop&w=800&h=600', // Music equipment
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?fit=crop&w=800&h=600', // Music studio
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?fit=crop&w=800&h=600', // Musical instruments
    'https://images.unsplash.com/photo-1514649923863-ceaf75b7ec00?fit=crop&w=800&h=600'  // Band equipment
  ],
  'Party & Events': [
    'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?fit=crop&w=800&h=600', // Party
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?fit=crop&w=800&h=600', // Event
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?fit=crop&w=800&h=600', // Party lights
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?fit=crop&w=800&h=600', // Event setup
    'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?fit=crop&w=800&h=600', // Party equipment
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fit=crop&w=800&h=600', // DJ equipment
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?fit=crop&w=800&h=600'  // Event lighting
  ],
  'Cleaning Equipment': [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?fit=crop&w=800&h=600', // Vacuum
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?fit=crop&w=800&h=600', // Cleaning
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?fit=crop&w=800&h=600', // Cleaning supplies
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?fit=crop&w=800&h=600', // Floor cleaner
    'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?fit=crop&w=800&h=600', // Cleaning equipment
    'https://images.unsplash.com/photo-1596263373793-6de7ccbd3e2c?fit=crop&w=800&h=600', // Buffer
    'https://images.unsplash.com/photo-1626170733247-dea1a73a3644?fit=crop&w=800&h=600'  // Cleaning tools
  ]
};

// Specific equipment mappings for exact matches
const specificEquipmentImages = {
  'DSLR Camera': [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1584038877214-9e8f1f65b6e3?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1533425962554-8a1f1b1a3f6a?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1542567455-cd733f23fbb1?fit=crop&w=800&h=600'
  ],
  'Leaf Blower': [
    'https://images.unsplash.com/photo-1598902108854-10e335adac99?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1599686302990-d8f0da1a3fd7?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1621149437156-bca51e9a7dbe?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1592420114272-8e29c11a9d4a?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1600702845206-f2416c0aae6c?fit=crop&w=800&h=600'
  ],
  'Lawn Mower': [
    'https://images.unsplash.com/photo-1600702845206-f2416c0aae6c?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1598902108854-10e335adac99?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1599686302990-d8f0da1a3fd7?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1621149437156-bca51e9a7dbe?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1592420114272-8e29c11a9d4a?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?fit=crop&w=800&h=600'
  ],
  'Microphone': [
    'https://images.unsplash.com/photo-1520170350707-b2da59970118?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1547394765-185e1e68f34e?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1570752321219-41822a21a761?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?fit=crop&w=800&h=600'
  ],
  'Mixer': [
    'https://images.unsplash.com/photo-1547394765-185e1e68f34e?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1520170350707-b2da59970118?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1570752321219-41822a21a761?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?fit=crop&w=800&h=600'
  ],
  'Guitar': [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1514649923863-ceaf75b7ec00?fit=crop&w=800&h=600'
  ],
  'Drone': [
    'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1579829366248-204fe8413f31?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1506947411487-a56738267384?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1524143986875-3b098d78b363?fit=crop&w=800&h=600'
  ],
  'Headphones': [
    'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?fit=crop&w=800&h=600'
  ],
  'Buffer': [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1596263373793-6de7ccbd3e2c?fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1626170733247-dea1a73a3644?fit=crop&w=800&h=600'
  ]
};

// Default images for categories not listed above
const defaultImages = [
  'https://images.unsplash.com/photo-1518644730709-0835105d9daa?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1620230874645-0d85a0a7a9e6?fit=crop&w=800&h=600',
  'https://images.unsplash.com/photo-1590479773265-7464e5d48118?fit=crop&w=800&h=600'
];

// Find the best matching images for a specific equipment
function findBestMatchingImages(title, category, description) {
  // Check for specific equipment matches first
  for (const [key, images] of Object.entries(specificEquipmentImages)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return images;
    }
  }
  
  // Check for category matches
  for (const [key, images] of Object.entries(categoryImages)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(category.toLowerCase())) {
      return images;
    }
  }
  
  // If no match found, return default images
  return defaultImages;
}

// Generate unique images for an equipment item
function generateUniqueImages(title, category, description, id) {
  const baseImages = findBestMatchingImages(title, category, description);
  
  // Create a unique set of images for this equipment
  return baseImages.map((img, index) => {
    // Add a unique parameter to ensure different images
    const uniqueParam = `&unique=${id.substring(0, 8)}-${index}-matched`;
    return img.includes('?') ? `${img}${uniqueParam}` : `${img}?${uniqueParam.substring(1)}`;
  });
}

async function matchEquipmentImages() {
  try {
    console.log('🔍 Matching equipment images with descriptions...');
    
    // Get all equipment
    const equipment = await prisma.equipment.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        imagesJson: true
      }
    });
    
    console.log(`Found ${equipment.length} equipment items to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each equipment item
    for (const item of equipment) {
      try {
        console.log(`\nProcessing: ${item.title}`);
        
        // Generate matched images for this equipment
        const matchedImages = generateUniqueImages(
          item.title, 
          item.category, 
          item.description, 
          item.id
        );
        
        // Update the equipment with matched images
        await prisma.equipment.update({
          where: { id: item.id },
          data: {
            imagesJson: JSON.stringify(matchedImages)
          }
        });
        
        updatedCount++;
        console.log(`✅ Updated images for "${item.title}" with matched images`);
      } catch (error) {
        console.error(`❌ Error updating "${item.title}": ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total: ${equipment.length}`);
    
    console.log('\n✨ Equipment image matching complete!');
    console.log('All equipment now has images that match their descriptions.');
  } catch (error) {
    console.error('Error matching equipment images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
matchEquipmentImages(); 