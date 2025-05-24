import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../prisma/generated/client';

export async function GET() {
  try {
    // Test database connection
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 