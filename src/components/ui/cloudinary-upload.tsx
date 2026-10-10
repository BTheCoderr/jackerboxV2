"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface CloudinaryUploadProps {
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: Error) => void;
  buttonText?: string;
  uploadPreset?: string; // Legacy prop retained for calling components; never used client-side
  className?: string;
  buttonClassName?: string;
  multiple?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

export function CloudinaryUpload({
  onUploadSuccess, onUploadError, buttonText = 'Upload Image',
  className, buttonClassName, multiple = false, maxFiles = 10,
  acceptedFileTypes = 'image/*',
}: CloudinaryUploadProps) {
  const [busy, setBusy] = useState(false);
  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length || busy) return;
    setBusy(true);
    try {
      const results = [];
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/upload/images', { method: 'POST', body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.url) throw new Error(data.message || 'Unable to save image');
        results.push({ secure_url: data.url, public_id: data.publicId });
      }
      onUploadSuccess?.(multiple ? results : results[0]);
    } catch (cause) {
      onUploadError?.(cause instanceof Error ? cause : new Error('Upload failed'));
    } finally {
      setBusy(false);
    }
  }, [onUploadSuccess, onUploadError, multiple, busy]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [acceptedFileTypes]: [] },
    disabled: busy,
    maxSize: 5 * 1024 * 1024,
    multiple,
    maxFiles: multiple ? maxFiles : 1,
  });

  return <div {...getRootProps()} className={cn(
    'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center',
    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
    busy && 'cursor-wait opacity-60',
    className
  )}>
    <input {...getInputProps()} />
    <button type="button" disabled={busy}
      className={cn('rounded bg-jacker-blue px-4 py-2 text-white disabled:opacity-50', buttonClassName)}>
      {busy ? 'Uploading…' : buttonText}
    </button>
  </div>;
}
