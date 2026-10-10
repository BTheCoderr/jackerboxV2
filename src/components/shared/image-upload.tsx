"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onChange: (urls: string[]) => void;
  value: string[];
  disabled?: boolean;
  maxFiles?: number;
}

export function ImageUpload({ onChange, value = [], disabled, maxFiles = 5 }: ImageUploadProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onDrop = useCallback(async (files: File[]) => {
    if (busy || disabled) return;
    if (value.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} photos allowed`);
      return;
    }
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    const uploaded = [...value];
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) throw new Error('Each photo must be 5 MB or smaller');
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/upload/images', { method: 'POST', body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || typeof data.url !== 'string') {
          throw new Error(data.message || 'Unable to upload photo');
        }
        uploaded.push(data.url);
        onChange([...uploaded]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }, [value, onChange, maxFiles, disabled, busy]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    disabled: disabled || busy,
    maxSize: 5 * 1024 * 1024,
    maxFiles: Math.max(0, maxFiles - value.length),
  });

  return (
    <div className="space-y-3">
      <div {...getRootProps()}
        className={`rounded-lg border-2 border-dashed p-6 text-center ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} ${busy ? 'opacity-60' : 'cursor-pointer'}`}>
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm">{busy ? 'Saving photos…' : 'Drop or select equipment photos'}</p>
        <p className="mt-1 text-xs text-gray-500">3–5 photos, JPG/PNG/WebP, up to 5 MB each</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((url, index) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-md">
            <Image src={url} alt={`Equipment photo ${index + 1}`} width={220} height={220}
              className="h-full w-full object-cover" unoptimized />
            <button type="button" disabled={disabled || busy}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute right-1 top-1 rounded-full bg-white p-1 shadow disabled:opacity-40">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
