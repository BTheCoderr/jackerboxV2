import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} // If CLOUDINARY_URL exists, it will automatically configure cloudinary

export interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export const uploadImage = async (file: File | Buffer, options = {}): Promise<UploadResponse> => {
  try {
    const uploadOptions = {
      resource_type: 'auto',
      folder: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      ...options,
    };

    if (file instanceof File) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'jackerbox_uploads');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      return await response.json();
    } else {
      // Handle Buffer upload (server-side)
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadResponse);
          })
          .end(file);
      });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

export const getPublicIdFromUrl = (url: string): string => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};

export const optimizeImage = (url: string, options = {}) => {
  return cloudinary.url(url, {
    quality: 'auto',
    fetch_format: 'auto',
    ...options,
  });
}; 