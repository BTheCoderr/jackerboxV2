import { writeFileSync } from 'fs';
import { resolve } from 'path';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

function validateAndFormatKey(key: string) {
  // Remove any quotes from the key
  key = key.replace(/^["']|["']$/g, '');
  
  console.log('Original key length:', key.length);
  console.log('Key starts with:', key.substring(0, 50));
  console.log('Key ends with:', key.substring(key.length - 50));
  
  // Try to detect the key format
  const isPEM = key.includes('-----BEGIN PRIVATE KEY-----');
  const isEC = key.includes('-----BEGIN EC PRIVATE KEY-----');
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(key.replace(/\s/g, ''));
  
  console.log('\nKey format detection:');
  console.log('- Is PEM format:', isPEM);
  console.log('- Is EC format:', isEC);
  console.log('- Is Base64:', isBase64);
  
  // If the key is base64 and not in PEM format, try to convert it
  if (isBase64 && !isPEM && !isEC) {
    try {
      // Convert base64 to buffer
      const keyBuffer = Buffer.from(key, 'base64');
      
      // Create a key pair from the buffer
      const keyObject = crypto.createPrivateKey({
        key: keyBuffer,
        format: 'der',
        type: 'pkcs8'
      });
      
      // Export as PEM
      const pemKey = keyObject.export({
        type: 'pkcs8',
        format: 'pem'
      });
      
      console.log('\nConverted key to PEM format:', pemKey);
      key = pemKey.toString();
    } catch (error: any) {
      console.log('Failed to convert key:', error.message);
    }
  }
  
  // Clean the key
  let cleanKey = key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN EC PRIVATE KEY-----/g, '')
    .replace(/-----END EC PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
    
  console.log('\nCleaned key length:', cleanKey.length);
  
  // Try different formats
  const formats = [
    {
      name: 'Standard PEM',
      format: (k: string) => `-----BEGIN PRIVATE KEY-----\n${
        k.match(/.{1,64}/g)?.join('\n') || k
      }\n-----END PRIVATE KEY-----`
    },
    {
      name: 'EC PEM',
      format: (k: string) => `-----BEGIN EC PRIVATE KEY-----\n${
        k.match(/.{1,64}/g)?.join('\n') || k
      }\n-----END EC PRIVATE KEY-----`
    }
  ];
  
  console.log('\nTesting key formats:');
  for (const { name, format } of formats) {
    try {
      const formattedKey = format(cleanKey);
      console.log(`\nTrying ${name}:`);
      console.log(formattedKey);
      
      // Try to sign a test payload
      const testToken = jwt.sign({ test: true }, formattedKey, { algorithm: 'ES256' });
      console.log('\nSuccess! Generated test token:', testToken.substring(0, 50) + '...');
      
      // Save the working key format
      const keyPath = resolve(__dirname, '../.apple-key.txt');
      writeFileSync(keyPath, formattedKey);
      console.log('\nSaved working key format to:', keyPath);
      
      return formattedKey;
    } catch (error: any) {
      console.log(`Failed with ${name}:`, error.message);
    }
  }
  
  throw new Error('Could not validate key in any format');
}

try {
  const key = process.env.APPLE_PRIVATE_KEY;
  if (!key) {
    throw new Error('APPLE_PRIVATE_KEY not found in environment variables');
  }
  
  console.log('Validating Apple private key...\n');
  validateAndFormatKey(key);
  console.log('\nKey validation successful!');
} catch (error: any) {
  console.error('\nValidation failed:', error.message);
  process.exit(1);
} 