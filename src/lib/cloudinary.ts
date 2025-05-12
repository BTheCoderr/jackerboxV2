// This file provides safe access to Cloudinary in both server and client components

// Define a type for the Cloudinary configuration
type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret?: string;
  secure: boolean;
};

// The full Cloudinary SDK is only available on the server
// This ensures we don't try to import node modules on the client
let cloudinary: any = null;
let cloudinaryConfig: CloudinaryConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  secure: true,
};

// Only load the actual Cloudinary SDK in server context
if (typeof window === 'undefined') {
  try {
    // This will only run on the server
    cloudinary = require('cloudinary').v2;
    
    // Configure with environment variables
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  } catch (error) {
    console.error('Failed to initialize Cloudinary on server:', error);
  }
}

// Safe client-side helpers that don't import the Node.js SDK
export const generateCloudinaryUrl = (publicId: string, options: Record<string, any> = {}) => {
  const { cloud_name } = cloudinaryConfig;
  const transformations = Object.entries(options)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return `https://res.cloudinary.com/${cloud_name}/image/upload/${transformations}/${publicId}`;
};

// Safe export that will not break client-side imports
export { cloudinary };

// This is the server-only uploader function - will only work in Server Components or API routes
export async function uploadImage(file: Buffer | string, options: Record<string, any> = {}) {
  if (typeof window !== 'undefined') {
    throw new Error('uploadImage can only be called from server-side code');
  }
  
  if (!cloudinary) {
    throw new Error('Cloudinary SDK is not available on the server');
  }

  try {
    const result = await cloudinary.uploader.upload(file, options);
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

// This function generates a signature for client-side uploads
export async function generateUploadSignature(params: Record<string, any> = {}) {
  if (typeof window !== 'undefined') {
    throw new Error('generateUploadSignature can only be called from server-side code');
  }
  
  if (!cloudinary) {
    throw new Error('Cloudinary SDK is not available on the server');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    ...params,
  }, process.env.CLOUDINARY_API_SECRET || '');

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}

// Export configuration for client-side usage
export const clientConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
}; 