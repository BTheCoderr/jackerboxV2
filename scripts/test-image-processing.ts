import fs from 'fs';
import path from 'path';
import { processImage, verifyIdentity } from '../src/lib/image-service';

// Path to test images
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');
const TEST_ID_PATH = path.join(__dirname, 'test-id.jpg');
const TEST_SELFIE_PATH = path.join(__dirname, 'test-selfie.jpg');

async function testImageProcessing() {
  try {
    console.log('Testing image processing system...');
    
    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`Test image not found at: ${TEST_IMAGE_PATH}`);
      console.log('Please add a test image at this location to proceed.');
      return;
    }
    
    // Read test image
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    console.log(`Test image loaded: ${TEST_IMAGE_PATH} (${imageBuffer.length} bytes)`);
    
    // Process the image
    console.log('Processing image...');
    const result = await processImage(imageBuffer, 'image/jpeg', 'test');
    
    console.log('Image processing result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.isValid) {
      console.log('✅ Image processing successful!');
      console.log(`S3 Key: ${result.s3Key}`);
      console.log(`Cloudinary URL: ${result.cloudinaryUrl}`);
    } else {
      console.log('❌ Image processing failed!');
      console.log(`Message: ${result.message}`);
    }
    
    // Test ID verification if both ID and selfie images exist
    if (fs.existsSync(TEST_ID_PATH) && fs.existsSync(TEST_SELFIE_PATH)) {
      console.log('\nTesting ID verification...');
      
      const idBuffer = fs.readFileSync(TEST_ID_PATH);
      const selfieBuffer = fs.readFileSync(TEST_SELFIE_PATH);
      
      console.log(`ID image loaded: ${TEST_ID_PATH} (${idBuffer.length} bytes)`);
      console.log(`Selfie image loaded: ${TEST_SELFIE_PATH} (${selfieBuffer.length} bytes)`);
      
      console.log('Verifying identity...');
      const verificationResult = await verifyIdentity(idBuffer, selfieBuffer);
      
      console.log('Identity verification result:');
      console.log(JSON.stringify(verificationResult, null, 2));
      
      if (verificationResult.isVerified) {
        console.log('✅ Identity verification successful!');
        if (verificationResult.extractedText && verificationResult.extractedText.length > 0) {
          console.log('Extracted text from ID:');
          verificationResult.extractedText.forEach((text, index) => {
            console.log(`  ${index + 1}. ${text}`);
          });
        }
      } else {
        console.log('❌ Identity verification failed!');
        console.log(`Message: ${verificationResult.message}`);
      }
    } else {
      console.log('\nSkipping ID verification test - test images not found.');
      console.log(`Expected ID image at: ${TEST_ID_PATH}`);
      console.log(`Expected selfie image at: ${TEST_SELFIE_PATH}`);
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testImageProcessing(); 