import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

interface UploadParams {
  timestamp: number;
  folder?: string;
  transformation?: string;
  tags?: string[];
}

export const generateUploadSignature = (params: UploadParams) => {
  const { timestamp, folder = 'uploads', transformation = '', tags = [] } = params;
  
  // Create the string to sign
  const toSign = {
    timestamp,
    folder,
    transformation,
    tags: tags.join(','),
  };

  // Sort keys alphabetically
  const sortedKeys = Object.keys(toSign).sort();
  const stringToSign = sortedKeys
    .map(key => `${key}=${toSign[key as keyof typeof toSign]}`)
    .join('&');

  // Generate signature
  const signature = crypto
    .createHash('sha256')
    .update(stringToSign + cloudinary.config().api_secret)
    .digest('hex');

  return {
    signature,
    timestamp,
    folder,
    transformation,
    tags,
    apiKey: cloudinary.config().api_key,
  };
};

export const validateUpload = async (file: File): Promise<boolean> => {
  // File type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // File size validation (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large');
  }

  return true;
};

export const moderateContent = async (publicId: string) => {
  try {
    // Get moderation results from Cloudinary
    const result = await cloudinary.api.resource(publicId, {
      moderation: 'aws_rek'
    });

    // Check moderation status
    const moderation = result.moderation?.aws_rek;
    if (moderation && moderation.status === 'rejected') {
      // Delete the rejected image
      await cloudinary.uploader.destroy(publicId);
      throw new Error('Content violates moderation policy');
    }

    return result;
  } catch (error) {
    console.error('Moderation failed:', error);
    throw error;
  }
};

export const addWatermark = async (publicId: string, watermarkText: string) => {
  try {
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      transformation: [
        {
          overlay: {
            font_family: 'Arial',
            font_size: 40,
            text: watermarkText
          },
          color: '#FFFFFF',
          opacity: 50,
          angle: 45,
        }
      ]
    });
    return result;
  } catch (error) {
    console.error('Watermark failed:', error);
    throw error;
  }
}; 