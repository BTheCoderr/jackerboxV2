import jwt from 'jsonwebtoken';

const key = `-----BEGIN EC PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg/oZC1PE/oZG8Fhq+
AQ2oMKsX1neSAmcDoitmTMvgzagCgYIKoZIzj0DAQehRANCAAQ9u3THkeByaDPIGVq7Nvi9oA1KY9dn/p64KIc7mRl5ps
x32CCo6rOCX9V2yP+sPpL+5CegESbKgMR1LA8xJPbZ1g6mrSdmBuoXSI/e1Obaa
P2/2Wf+r
-----END EC PRIVATE KEY-----`;

// First, let's analyze the key
console.log('Key Analysis:');
console.log('--------------');
console.log('Key length:', key.length);
console.log('Contains BEGIN:', key.includes('-----BEGIN EC PRIVATE KEY-----'));
console.log('Contains END:', key.includes('-----END EC PRIVATE KEY-----'));

// Clean and format the key
const cleanKey = key
  .replace(/-----BEGIN EC PRIVATE KEY-----/, '')
  .replace(/-----END EC PRIVATE KEY-----/, '')
  .replace(/[\n\r\s]/g, '');

console.log('\nBase64 key content (cleaned):');
console.log(cleanKey);
console.log('Clean key length:', cleanKey.length);

// Format the key properly
const formattedKey = `-----BEGIN EC PRIVATE KEY-----\n${
  cleanKey.match(/.{1,64}/g).join('\n')
}\n-----END EC PRIVATE KEY-----`;

console.log('\nFormatted key:');
console.log(formattedKey);

try {
  // Test signing
  const token = jwt.sign({
    test: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300
  }, formattedKey, { algorithm: 'ES256' });
  
  console.log('\nSuccess! Generated token:', token.substring(0, 50) + '...');
  
  // Verify the token
  const verified = jwt.verify(token, formattedKey, { algorithms: ['ES256'] });
  console.log('Token verification successful!', verified);
  
} catch (error) {
  console.error('\nError:', error.message);
  process.exit(1);
} 