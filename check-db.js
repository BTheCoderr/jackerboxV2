// Database check script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check equipment count
    const equipmentCount = await prisma.equipment.count();
    console.log('Total equipment items:', equipmentCount);
    
    if (equipmentCount > 0) {
      const equipment = await prisma.equipment.findMany({ 
        take: 3,
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('Recent equipment:', JSON.stringify(equipment.map(eq => ({
        id: eq.id,
        title: eq.title,
        dailyRate: eq.dailyRate
      })), null, 2));
    }
    
    // Check user count
    const userCount = await prisma.user.count();
    console.log('Total users:', userCount);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          email: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('Recent users:', JSON.stringify(users, null, 2));
    }
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 