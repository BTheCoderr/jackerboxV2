import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.equipment.count();
    console.log('Equipment count:', count);
    
    if (count > 0) {
      const sample = await prisma.equipment.findMany({ take: 3 });
      console.log('Sample equipment:', JSON.stringify(sample.map(eq => ({ 
        id: eq.id, 
        title: eq.title 
      })), null, 2));
    } else {
      console.log('No equipment found in the database.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
}); 