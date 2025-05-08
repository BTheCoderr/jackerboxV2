import { z } from 'zod';
import { NextResponse } from 'next/server';

// Common validation patterns
const patterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};

// Common validation schemas
export const schemas = {
  // User related schemas
  user: {
    create: z.object({
      email: z.string().email(),
      password: z.string().regex(patterns.password, {
        message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character',
      }),
      name: z.string().min(2).max(50),
      phone: z.string().regex(patterns.phone).optional(),
    }),
    update: z.object({
      name: z.string().min(2).max(50).optional(),
      phone: z.string().regex(patterns.phone).optional(),
      bio: z.string().max(500).optional(),
    }),
  },

  // Equipment related schemas
  equipment: {
    create: z.object({
      name: z.string().min(3).max(100),
      description: z.string().min(10).max(1000),
      price: z.number().positive(),
      category: z.string(),
      condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
      images: z.array(z.string().url()).min(1).max(10),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    }),
    update: z.object({
      name: z.string().min(3).max(100).optional(),
      description: z.string().min(10).max(1000).optional(),
      price: z.number().positive().optional(),
      category: z.string().optional(),
      condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
      images: z.array(z.string().url()).min(1).max(10).optional(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
    }),
  },

  // Rental related schemas
  rental: {
    create: z.object({
      equipmentId: z.string().uuid(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      notes: z.string().max(500).optional(),
    }),
    update: z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'completed']),
      notes: z.string().max(500).optional(),
    }),
  },

  // Message related schemas
  message: {
    create: z.object({
      recipientId: z.string().uuid(),
      content: z.string().min(1).max(1000),
      attachments: z.array(z.string().url()).max(5).optional(),
    }),
  },

  // Payment related schemas
  payment: {
    create: z.object({
      amount: z.number().positive(),
      currency: z.string().length(3),
      paymentMethodId: z.string(),
      description: z.string().max(200),
    }),
  },
};

// Validation middleware
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation error',
            details: error.errors,
          },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      ),
    };
  }
}

// Sanitize input
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim();
}

// Validate file upload
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'] } = options;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
} 