import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/auth-utils';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Validation schema for the request body
const requestSchema = z.object({
  folder: z.string().optional().default('uploads'),
  tags: z.array(z.string()).optional().default([]),
  transformation: z.string().optional(),
});

/**
 * Generate a Cloudinary upload signature for secure direct uploads
 */
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const result = requestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { folder, tags, transformation } = result.data;
    
    // Generate a timestamp and signature
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Create the signature parameters
    const params = {
      timestamp,
      folder,
      tags: tags.join(','),
      ...(transformation && { transformation }),
    };
    
    // Generate the signature
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET || '');
    
    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate signature', message: (error as Error).message },
      { status: 500 }
    );
  }
} 