import { NextResponse } from 'next/server';
import { generateUploadSignature } from '@/lib/upload-security';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { folder, transformation, tags } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = generateUploadSignature({
      timestamp,
      folder,
      transformation,
      tags
    });

    return NextResponse.json(signature);
  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
} 