'use client';

import CloudinaryUploader from '@/components/CloudinaryUploader';
import { Toaster } from 'sonner';

export default function TestUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-8 text-center">
        Image Upload Test Page
      </h1>
      <CloudinaryUploader />
    </div>
  );
} 