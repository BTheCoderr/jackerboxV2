import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/auth-options';
import { PrismaClient } from '../../../../prisma/generated/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user rentals
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rentals = await prisma.rental.findMany({
      where: {
        OR: [
          { renterId: user.id },
          { equipment: { ownerId: user.id } }
        ]
      },
      include: {
        equipment: {
          select: {
            title: true,
            category: true,
            hourlyRate: true,
            dailyRate: true,
            imagesJson: true
          }
        },
        renter: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(rentals);
  } catch (error) {
    console.error('Rentals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { equipmentId, startDate, endDate, totalPrice } = body;

    if (!equipmentId || !startDate || !endDate || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create rental
    const rental = await prisma.rental.create({
      data: {
        equipmentId,
        renterId: user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
                 totalPrice: parseFloat(totalPrice),
        status: 'PENDING'
      },
      include: {
        equipment: {
          select: {
            title: true,
            category: true
          }
        }
      }
    });

    return NextResponse.json(rental);
  } catch (error) {
    console.error('Rental creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 