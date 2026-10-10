import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { uploadImage } from '@/lib/cloudinary-config';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!process.env.CLOUDINARY_URL &&
      (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
    return NextResponse.json({ message: 'Image storage is not configured' }, { status: 503 });
  }
  try {
    const data = await request.formData();
    const file = data.get('file');
    if (!(file instanceof File) || !IMAGE_MIMES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Choose a JPEG, PNG or WebP photo of 5 MB or less' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    const valid = file.type === 'image/jpeg' ? isJpg : file.type === 'image/png' ? isPng : isWebp;
    if (!valid) return NextResponse.json({ message: 'File contents do not match the selected image type' }, { status: 400 });

    const uploaded = await uploadImage(buffer, {
      folder: `jackerbox/equipment/${user.id}`,
      resource_type: 'image',
      overwrite: false,
    });
    if (!uploaded.secure_url.startsWith('https://res.cloudinary.com/')) {
      throw new Error('Image storage returned an unexpected URL');
    }
    return NextResponse.json({ url: uploaded.secure_url, publicId: uploaded.public_id });
  } catch (error) {
    console.error('Image storage failed', error);
    return NextResponse.json({ message: 'Unable to save photo' }, { status: 500 });
  }
}
