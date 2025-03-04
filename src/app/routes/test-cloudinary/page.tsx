'use client';

import { useState } from 'react';
import { CloudinaryUpload } from '@/components/ui/cloudinary-upload';

export default function TestCloudinaryPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleUploadComplete = (files: any[]) => {
    console.log('Upload complete:', files);
    setUploadedFiles(files);
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    alert(`Upload error: ${error.message}`);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Cloudinary Upload</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
        <CloudinaryUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          folder="test-uploads"
          multiple={true}
        />
      </div>
      
      {uploadedFiles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="border rounded-lg p-4">
                {file.format.match(/^(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={file.secureUrl}
                    alt={file.originalFilename}
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded mb-2">
                    <span className="text-gray-500">{file.format.toUpperCase()}</span>
                  </div>
                )}
                <p className="text-sm truncate">{file.originalFilename}</p>
                <p className="text-xs text-gray-500">
                  {file.width}x{file.height} • {Math.round(file.bytes / 1024)} KB
                </p>
                <a
                  href={file.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm hover:underline"
                >
                  View File
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 