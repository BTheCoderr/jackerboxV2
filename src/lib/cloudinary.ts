import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

export const getCloudinaryUrl = (publicId: string, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
};

export const uploadToCloudinary = async (file: File | string, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file as string, {
      resource_type: 'auto',
      ...options,
    });
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Helper functions for common operations
export const uploadImage = async (file: File | Buffer, folder: string = 'uploads') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto'
    });
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export const getImageUrl = (publicId: string, transformations: any = {}) => {
  return cloudinary.url(publicId, {
    ...transformations,
    secure: true
  });
}; 