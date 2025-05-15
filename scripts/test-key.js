import { readFileSync } from 'fs';
import jwt from 'jsonwebtoken';

// Function to format the key
function formatKey(key) {
  // Remove any quotes and trim whitespace
  key = key.replace(/^["']|["']$/g, '').trim();
  
  // If already properly formatted, return as is
  if (key.includes('-----BEGIN PRIVATE KEY-----') && 
      key.includes('-----END PRIVATE KEY-----')) {
    return key;
  }
  
  // Clean the key content
  const cleanKey = key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
    
  // Format with proper line breaks
  const formattedContent = cleanKey.match(/.{1,64}/g).join('\n');
  
  // Add headers
  return `-----BEGIN PRIVATE KEY-----\n${formattedContent}\n-----END PRIVATE KEY-----`;
}

try {
  // Get key from environment
  const key = process.env.APPLE_PRIVATE_KEY;
  if (!key) {
    throw new Error('APPLE_PRIVATE_KEY not found in environment');
  }
  
  console.log('Original key:', key);
  
  // Format the key
  const formattedKey = formatKey(key);
  console.log('\nFormatted key:', formattedKey);
  
  // Test signing
  const testPayload = {
    test: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300
  };
  
  const token = jwt.sign(testPayload, formattedKey, { algorithm: 'ES256' });
  console.log('\nTest signing successful! Token:', token.substring(0, 50) + '...');
  
  // Verify the token
  const verified = jwt.verify(token, formattedKey, { algorithms: ['ES256'] });
  console.log('\nToken verification successful!', verified);
  
} catch (error) {
  console.error('\nError:', error.message);
  process.exit(1);
} 