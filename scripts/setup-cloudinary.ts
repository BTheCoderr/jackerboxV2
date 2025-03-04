import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import readline from 'readline';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt the user for input
 */
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Update the .env file with Cloudinary credentials
 */
async function updateEnvFile(cloudName: string, apiKey: string, apiSecret: string): Promise<void> {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    // Read the current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update or add Cloudinary variables
    const cloudinaryVars = [
      `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="${cloudName}"`,
      `CLOUDINARY_API_KEY="${apiKey}"`,
      `CLOUDINARY_API_SECRET="${apiSecret}"`
    ];
    
    // Check if each variable exists and update it
    cloudinaryVars.forEach(varLine => {
      const varName = varLine.split('=')[0];
      const regex = new RegExp(`${varName}=.*`, 'g');
      
      if (envContent.match(regex)) {
        // Update existing variable
        envContent = envContent.replace(regex, varLine);
      } else {
        // Add new variable
        if (envContent.includes('# Cloudinary')) {
          // Add after the Cloudinary comment
          envContent = envContent.replace(
            '# Cloudinary (Image Upload)',
            '# Cloudinary (Image Upload)\n' + cloudinaryVars.join('\n')
          );
        } else {
          // Add at the end
          envContent += '\n\n# Cloudinary (Image Upload)\n' + cloudinaryVars.join('\n');
        }
      }
    });
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated with Cloudinary credentials');
  } catch (error) {
    console.error('Error updating .env file:', error);
    throw error;
  }
}

/**
 * Test Cloudinary configuration
 */
async function testCloudinaryConfig(cloudName: string, apiKey: string, apiSecret: string): Promise<boolean> {
  try {
    // Configure Cloudinary with the provided credentials
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    
    // Test the configuration by getting account info
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!');
    console.log('Account status:', result.status);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
    return false;
  }
}

/**
 * Create upload presets for different purposes
 */
async function createUploadPresets(cloudName: string, apiKey: string, apiSecret: string): Promise<void> {
  try {
    // Configure Cloudinary with the provided credentials
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    
    // Create upload presets for different purposes
    const presets = [
      {
        name: 'jackerbox_profile_images',
        folder: 'profile-images',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        allowed_formats: 'jpg,jpeg,png,webp',
        moderation: 'aws_rek'
      },
      {
        name: 'jackerbox_equipment_images',
        folder: 'equipment',
        transformation: [{ width: 1200, height: 800, crop: 'fill' }],
        allowed_formats: 'jpg,jpeg,png,webp',
        moderation: 'aws_rek'
      },
      {
        name: 'jackerbox_id_documents',
        folder: 'id-documents',
        transformation: [{ width: 1000, crop: 'limit' }],
        allowed_formats: 'jpg,jpeg,png,pdf',
        moderation: 'aws_rek'
      }
    ];
    
    for (const preset of presets) {
      try {
        // Check if preset already exists
        const response = await cloudinary.api.upload_presets();
        const exists = response.presets?.some((p: any) => p.name === preset.name) || false;
        
        if (exists) {
          console.log(`Upload preset '${preset.name}' already exists, updating...`);
          await cloudinary.api.update_upload_preset(preset.name, {
            folder: preset.folder,
            transformation: preset.transformation,
            allowed_formats: preset.allowed_formats,
            moderation: preset.moderation
          });
        } else {
          console.log(`Creating upload preset '${preset.name}'...`);
          await cloudinary.api.create_upload_preset({
            name: preset.name,
            folder: preset.folder,
            transformation: preset.transformation,
            allowed_formats: preset.allowed_formats,
            moderation: preset.moderation,
            unsigned: false
          });
        }
        console.log(`✅ Upload preset '${preset.name}' configured successfully`);
      } catch (error) {
        console.error(`❌ Error configuring upload preset '${preset.name}':`, error);
      }
    }
  } catch (error) {
    console.error('Error creating upload presets:', error);
    throw error;
  }
}

/**
 * Main function to set up Cloudinary
 */
async function main() {
  console.log('🚀 Setting up Cloudinary for Jackerbox...');
  
  try {
    // Check if Cloudinary credentials are already in .env
    const existingCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const existingApiKey = process.env.CLOUDINARY_API_KEY;
    const existingApiSecret = process.env.CLOUDINARY_API_SECRET;
    
    let cloudName = existingCloudName;
    let apiKey = existingApiKey;
    let apiSecret = existingApiSecret;
    
    // If credentials are missing, prompt the user
    if (!cloudName || !apiKey || !apiSecret) {
      console.log('\n📝 Please enter your Cloudinary credentials:');
      console.log('(You can find these in your Cloudinary dashboard: https://cloudinary.com/console)\n');
      
      cloudName = cloudName || await prompt('Cloud Name: ');
      apiKey = apiKey || await prompt('API Key: ');
      apiSecret = apiSecret || await prompt('API Secret: ');
      
      // Update the .env file with the new credentials
      await updateEnvFile(cloudName, apiKey, apiSecret);
    } else {
      console.log('✅ Cloudinary credentials found in .env file');
    }
    
    // Test the Cloudinary configuration
    const isConfigValid = await testCloudinaryConfig(cloudName, apiKey, apiSecret);
    
    if (isConfigValid) {
      // Ask if the user wants to create upload presets
      const createPresets = await prompt('\nDo you want to create upload presets for different types of content? (y/n): ');
      
      if (createPresets.toLowerCase() === 'y') {
        await createUploadPresets(cloudName, apiKey, apiSecret);
      }
      
      console.log('\n🎉 Cloudinary setup complete!');
      console.log('\nNext steps:');
      console.log('1. Use the CloudinaryUpload component for file uploads');
      console.log('2. Use the CloudinaryImage component for displaying images');
      console.log('3. Update your image processing pipeline to use Cloudinary');
    } else {
      console.log('\n❌ Cloudinary setup failed. Please check your credentials and try again.');
    }
  } catch (error) {
    console.error('Error setting up Cloudinary:', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
