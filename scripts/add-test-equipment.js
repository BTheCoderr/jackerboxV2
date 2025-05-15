// Add test equipment to Neon database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Adding test equipment to verify Neon database integration...');
  
  try {
    // Get the first user to be the owner
    const owner = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (!owner) {
      console.log('❌ Cannot find test user. Make sure to run the seed script first.');
      return;
    }
    
    // Create test equipment
    const equipment = await prisma.equipment.create({
      data: {
        title: 'Professional DSLR Camera Kit',
        description: 'Complete professional camera kit including Canon EOS 5D Mark IV, 3 lenses, tripod, and accessories.',
        category: 'PHOTOGRAPHY',
        subcategory: 'Cameras',
        condition: 'EXCELLENT',
        location: 'Boston, MA',
        hourlyRate: 25,
        dailyRate: 75,
        weeklyRate: 300,
        isAvailable: true,
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd'
        ]),
        tagsJson: JSON.stringify(['camera', 'photography', 'professional', 'canon']),
        latitude: 42.3601,
        longitude: -71.0589,
        owner: {
          connect: { id: owner.id }
        }
      }
    });
    
    console.log('✅ Created test equipment:', equipment.title);
    console.log('Equipment ID:', equipment.id);
    
    // Create another equipment item
    const equipment2 = await prisma.equipment.create({
      data: {
        title: 'Heavy Duty Construction Jackhammer',
        description: 'Industrial grade jackhammer perfect for demolition projects and construction work.',
        category: 'CONSTRUCTION',
        subcategory: 'Power Tools',
        condition: 'GOOD',
        location: 'Boston, MA',
        hourlyRate: 45,
        dailyRate: 120,
        weeklyRate: 500,
        isAvailable: true,
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1',
          'https://images.unsplash.com/photo-1530124566582-a618bc2615dc'
        ]),
        tagsJson: JSON.stringify(['construction', 'jackhammer', 'tools', 'demolition']),
        latitude: 42.3601,
        longitude: -71.0589,
        owner: {
          connect: { id: owner.id }
        }
      }
    });
    
    console.log('✅ Created test equipment:', equipment2.title);
    console.log('Equipment ID:', equipment2.id);
    
    console.log('\n✅ Test data added successfully to Neon database!');
    console.log('Refresh the home page to see the equipment listings');
    
  } catch (error) {
    console.error('Error adding test equipment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 