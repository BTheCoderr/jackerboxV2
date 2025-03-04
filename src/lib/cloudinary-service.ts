import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload an image to Cloudinary
 * @param imageBuffer The image buffer to upload
 * @param folder The folder to upload to
 * @param publicId Optional public ID for the image
 * @param preset The preset to use for the upload
 * @returns The Cloudinary upload result
 */
export async function uploadToCloudinary(
  imageBuffer: Buffer,
  folder: string = 'jackerbox',
  publicId?: string,
  preset: 'equipment' | 'profile' | 'id' = 'equipment'
): Promise<any> {
  return new Promise((resolve, reject) => {
    const presetConfigs = {
      equipment: {
        folder: `${folder}/equipment`,
        transformation: [
          { width: 1200, height: 800, crop: 'fill', quality: 'auto' },
          { format: 'auto' },
          { fetch_format: 'auto' },
          { responsive_breakpoints: { 
            create_derived: true, 
            bytes_step: 20000,
            min_width: 200,
            max_width: 1200
          }},
          { dpr: 'auto' },
          { effect: 'auto_contrast' },
          { effect: 'auto_brightness' }
        ],
        eager: [
          { width: 300, height: 200, crop: 'fill', format: 'webp' }, // Thumbnail
          { width: 600, height: 400, crop: 'fill', format: 'webp' }, // Medium
          { width: 1200, height: 800, crop: 'fill', format: 'webp' } // Large
        ],
        eager_async: true,
        resource_type: 'image' as const,
        quality_analysis: true,
        categorization: 'aws_rek_tagging',
        auto_tagging: 0.7
      },
      profile: {
        folder: `${folder}/profiles`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { format: 'auto' },
          { fetch_format: 'auto' },
          { effect: 'auto_contrast' },
          { effect: 'auto_brightness' }
        ],
        eager: [
          { width: 100, height: 100, crop: 'fill', gravity: 'face', format: 'webp' }, // Small
          { width: 200, height: 200, crop: 'fill', gravity: 'face', format: 'webp' }, // Medium
          { width: 400, height: 400, crop: 'fill', gravity: 'face', format: 'webp' } // Large
        ],
        eager_async: true,
        resource_type: 'image' as const
      },
      id: {
        folder: `${folder}/id-documents`,
        transformation: [
          { width: 1000, crop: 'limit' },
          { format: 'auto' },
          { fetch_format: 'auto' }
        ],
        access_mode: 'authenticated',
        resource_type: 'image' as const,
        quality_analysis: true
      }
    };

    const uploadOptions = {
      ...presetConfigs[preset],
      public_id: publicId
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    // Convert buffer to stream and pipe to uploadStream
    const Readable = require('stream').Readable;
    const readableStream = new Readable();
    readableStream.push(imageBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Generate a Cloudinary URL with transformations
 * @param publicId The public ID of the image
 * @param width The desired width
 * @param height The desired height
 * @param crop The crop mode
 * @returns The transformed image URL
 */
export function getCloudinaryUrl(
  publicId: string,
  width?: number,
  height?: number,
  crop: string = 'fill'
): string {
  const transformations: any = {
    quality: 'auto',
    fetch_format: 'auto',
  };
  
  if (width) transformations.width = width;
  if (height) transformations.height = height;
  if (crop) transformations.crop = crop;
  
  return cloudinary.url(publicId, transformations);
}

/**
 * Delete an image from Cloudinary
 * @param publicId The public ID of the image to delete
 * @returns The deletion result
 */
export async function deleteFromCloudinary(publicId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
} 