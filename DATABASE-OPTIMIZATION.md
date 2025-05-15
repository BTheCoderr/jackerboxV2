# JackerBox Database Optimization Plan

This document outlines strategies for optimizing the JackerBox database for better performance, scalability, and reliability.

## Current Database Structure

JackerBox uses a PostgreSQL database with Prisma as the ORM. The main entities include:

- User
- Equipment
- Rental
- Payment
- Review
- Availability
- Messages
- Notifications

## Performance Bottlenecks

Based on the database schema and application functionality, potential bottlenecks include:

1. Complex queries on equipment listings with multiple filters
2. Searches with location-based filtering
3. User dashboard queries that join multiple tables
4. Rental history and payment records lookups
5. Notification queries for active users

## Optimization Strategies

### 1. Add Strategic Indexes

The database already has indexes on foreign keys, but additional indexes can improve query performance:

```prisma
// Add these indexes to schema.prisma

model Equipment {
  // ... existing fields

  // Add these indexes
  @@index([category, subcategory])
  @@index([isAvailable, moderationStatus])
  @@index([location])
  @@index([createdAt])
  @@index([dailyRate])
}

model Rental {
  // ... existing fields

  // Add these indexes
  @@index([status])
  @@index([startDate, endDate])
  @@index([renterId, status])
  @@index([equipmentId, status])
}

model Payment {
  // ... existing fields

  // Add these indexes
  @@index([status])
  @@index([createdAt])
  @@index([ownerPaidOut])
}

model Review {
  // ... existing fields

  // Add these indexes
  @@index([rating])
  @@index([authorId, createdAt])
  @@index([equipmentId, createdAt])
}

model Notification {
  // ... existing fields

  // Add these indexes
  @@index([userId, read])
  @@index([createdAt])
}
```

Apply these changes with Prisma migration:

```bash
npx prisma migrate dev --name add_performance_indexes
```

### 2. Query Optimization

#### Equipment Search Query

Optimize the equipment search query:

```typescript
// src/app/api/equipment/search/route.ts

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build the where clause more efficiently
    const where: any = {
      isAvailable: true,
      moderationStatus: 'APPROVED',
    };
    
    // Only add conditions that are provided
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    // Combine price filters in one condition
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.dailyRate = {};
      if (minPrice !== undefined) {
        where.dailyRate.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.dailyRate.lte = maxPrice;
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Use a transaction for parallel queries
    const [equipment, total] = await db.$transaction([
      db.equipment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          dailyRate: true,
          location: true,
          category: true,
          imagesJson: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          // Only include aggregated review data
          _count: {
            select: {
              reviews: true,
            }
          },
        }
      }),
      db.equipment.count({ where }),
    ]);
    
    // Process images outside of the database query
    const processedEquipment = equipment.map(item => ({
      ...item,
      images: JSON.parse(item.imagesJson || '[]'),
      imagesJson: undefined, // Remove the raw JSON
    }));
    
    return Response.json({
      data: processedEquipment,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error searching equipment:', error);
    return Response.json(
      { error: 'Failed to search equipment' },
      { status: 500 }
    );
  }
}
```

#### User Dashboard Queries

Optimize user dashboard queries:

```typescript
// src/app/api/user/dashboard/route.ts

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Use parallel queries with transaction
    const [
      activeRentals,
      pendingPayments,
      equipmentListings,
      unreadNotificationCount
    ] = await db.$transaction([
      // Active rentals - only get necessary fields
      db.rental.findMany({
        where: {
          renterId: userId,
          status: { in: ['APPROVED', 'PENDING'] },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          status: true,
          equipment: {
            select: {
              id: true,
              title: true,
              imagesJson: true,
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
        take: 5,
      }),
      
      // Pending payments
      db.payment.findMany({
        where: {
          rental: {
            renterId: userId,
          },
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          rental: {
            select: {
              id: true,
              equipment: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        take: 5,
      }),
      
      // Equipment listings
      db.equipment.findMany({
        where: {
          ownerId: userId,
        },
        select: {
          id: true,
          title: true,
          dailyRate: true,
          isAvailable: true,
          imagesJson: true,
          _count: {
            select: {
              rentals: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
      
      // Unread notification count - just get the count
      db.notification.count({
        where: {
          userId,
          read: false,
        },
      }),
    ]);
    
    // Process the data outside the database query
    const processedRentals = activeRentals.map(rental => ({
      ...rental,
      equipment: {
        ...rental.equipment,
        images: JSON.parse(rental.equipment.imagesJson || '[]').slice(0, 1),
        imagesJson: undefined,
      },
    }));
    
    const processedEquipment = equipmentListings.map(item => ({
      ...item,
      images: JSON.parse(item.imagesJson || '[]').slice(0, 1),
      imagesJson: undefined,
      rentalCount: item._count.rentals,
      _count: undefined,
    }));
    
    return Response.json({
      activeRentals: processedRentals,
      pendingPayments,
      equipmentListings: processedEquipment,
      unreadNotificationCount,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return Response.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
```

### 3. Database Connection Pooling

Configure Prisma for connection pooling:

```typescript
// src/lib/db.ts

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pool configuration
    // These are reasonable defaults for serverless environments
    connectionLimit: {
      min: 1,
      max: 10,
    },
  });
};

// Prevent multiple instances during development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma || prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### 4. Implement Pagination

Ensure all list endpoints use pagination to limit database load:

```typescript
// Generic pagination function
export function getPaginationParams(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;
  
  return {
    page,
    limit,
    skip,
  };
}

// Example usage in API route
export async function GET(req: Request) {
  const { page, limit, skip } = getPaginationParams(req);
  
  const [items, total] = await db.$transaction([
    db.equipment.findMany({
      skip,
      take: limit,
      // ... other options
    }),
    db.equipment.count({
      // ... where conditions
    }),
  ]);
  
  return Response.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  });
}
```

### 5. Introduce Read Replicas (for Production)

For higher scale, configure read replicas:

```typescript
// src/lib/db.ts

import { PrismaClient } from '@prisma/client';

// Primary database for writes
const writer = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Read replica for queries
const reader = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_REPLICA_URL || process.env.DATABASE_URL,
    },
  },
});

// Export a simple interface to use the appropriate client
export const db = {
  // For read operations
  read: reader,
  
  // For write operations
  write: writer,
  
  // For transactions that need both
  $transaction: async (operations: any[]) => {
    return await writer.$transaction(operations);
  },
};
```

### 6. Database Partitioning Strategy (Future)

For future scaling, consider partitioning the database:

1. **Time-based partitioning** for historical data (rentals, payments, notifications)
2. **Location-based partitioning** for equipment listings
3. **User-based sharding** for user data

### 7. Query Analysis and Monitoring

Implement query performance monitoring:

```typescript
// src/lib/monitoring/db-metrics.ts

import { redis } from '@/lib/redis';

export async function trackQueryPerformance(
  queryName: string,
  startTime: number,
  success: boolean
) {
  const duration = Date.now() - startTime;
  
  // Store metrics in Redis
  await redis.hincrby(`db:metrics:${queryName}`, 'count', 1);
  await redis.hincrby(`db:metrics:${queryName}`, 'totalDuration', duration);
  
  if (!success) {
    await redis.hincrby(`db:metrics:${queryName}`, 'failures', 1);
  }
  
  // Store the last 100 execution times for percentile calculation
  await redis.lpush(`db:metrics:${queryName}:durations`, duration);
  await redis.ltrim(`db:metrics:${queryName}:durations`, 0, 99);
  
  // Log slow queries
  if (duration > 500) {
    console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
  }
}

// Usage example
export async function getEquipmentWithTracking(id: string) {
  const startTime = Date.now();
  let success = false;
  
  try {
    const equipment = await db.equipment.findUnique({
      where: { id },
      // ... include options
    });
    
    success = true;
    return equipment;
  } finally {
    await trackQueryPerformance('getEquipment', startTime, success);
  }
}
```

## Implementation Plan

### Phase 1: Database Schema Optimization

1. **Add indexes to schema.prisma**
   - Create migration for new indexes
   - Apply indexes to production DB during low-traffic period

2. **Optimize query patterns**
   - Identify and refactor inefficient queries
   - Implement pagination for all list endpoints

### Phase 2: Connection Management

1. **Configure database connection pooling**
   - Update Prisma client configuration
   - Monitor connection usage

2. **Implement Redis caching for frequent queries**
   - Cache equipment listings
   - Cache user profiles
   - Cache search results

### Phase 3: Monitoring and Ongoing Optimization

1. **Add query performance tracking**
   - Implement query metrics collection
   - Set up alerts for slow queries

2. **Regularly review database performance**
   - Schedule weekly review of slowest queries
   - Optimize based on real usage patterns

## Success Metrics

- **Query response time**: Target < 100ms for common queries
- **Database load**: Keep CPU utilization under 70%
- **Connection efficiency**: Maintain connection pool efficiency > 90%
- **Cache hit ratio**: Aim for > 80% cache hit rate for common queries 