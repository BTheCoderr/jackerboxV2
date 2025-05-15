import crypto from 'crypto';

function analyzeKey(key) {
  console.log('Key Analysis:');
  console.log('--------------');
  
  // Remove whitespace and check length
  const cleanKey = key.replace(/\s+/g, '');
  console.log('Clean key length:', cleanKey.length);
  
  // Check if it's base64
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(cleanKey);
  console.log('Is valid base64:', isBase64);
  
  try {
    // Try to create a key object
    const keyObject = crypto.createPrivateKey(key);
    console.log('\nKey Information:');
    console.log('Type:', keyObject.type);
    console.log('Algorithm:', keyObject.asymmetricKeyType);
    
    // Try to export in different formats
    console.log('\nCan export as:');
    try {
      const pem = keyObject.export({ type: 'pkcs8', format: 'pem' });
      console.log('- PEM (PKCS8):', true);
    } catch (e) {
      console.log('- PEM (PKCS8):', false, e.message);
    }
    
    try {
      const der = keyObject.export({ type: 'pkcs8', format: 'der' });
      console.log('- DER (PKCS8):', true);
    } catch (e) {
      console.log('- DER (PKCS8):', false, e.message);
    }
    
  } catch (error) {
    console.log('\nFailed to create key object:', error.message);
  }
}

// Get key from environment
const key = process.env.APPLE_PRIVATE_KEY;
if (!key) {
  console.error('APPLE_PRIVATE_KEY not found in environment');
  process.exit(1);
}

console.log('Original key:\n', key);
console.log('\nAnalyzing key...\n');
analyzeKey(key); 