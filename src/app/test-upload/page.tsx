'use client';

import ImageUploadTest from '@/components/ImageUploadTest';
import { Toaster } from 'sonner';

export default function TestUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold text-center mb-8">
        Cloudinary Upload Test
      </h1>
      <ImageUploadTest />
    </div>
  );
} 