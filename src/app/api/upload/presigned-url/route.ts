import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { getSignedUploadUrl } from '@/lib/aws/s3-service';
import { requireAuth } from '@/lib/auth/auth-utils';
import { getAwsRegion, getAwsS3BucketName } from '@/lib/aws/env';

// Validation schema for the request body
const requestSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  folder: z.enum(['equipment', 'verification', 'uploads']).optional(),
  filename: z.string().regex(/^[a-zA-Z0-9._-]{1,100}$/).optional(),
});

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const user = await requireAuth();
    
    // Parse and validate the request body
    const body = await req.json();
    const result = requestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { contentType, folder = 'uploads', filename } = result.data;
    
    // Generate a unique key for the file
    const fileKey = `${uuidv4()}-${Date.now()}${filename ? `-${filename}` : ""}`;
    const key = `users/${user.id}/${folder}/${fileKey}`;
    
    // Generate a pre-signed URL for uploading
    const presignedUrl = await getSignedUploadUrl(key, contentType, 300); // 5 minutes expiry
    
    return NextResponse.json({
      success: true,
      presignedUrl,
      key,
      url: `https://${getAwsS3BucketName()}.s3.${getAwsRegion()}.amazonaws.com/${key}`,
      expiresIn: 300,
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    
    if ((error as any).name === 'AuthError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate pre-signed URL' },
      { status: 500 }
    );
  }
} 