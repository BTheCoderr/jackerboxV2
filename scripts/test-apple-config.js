import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function validateConfig() {
  console.log('Checking Apple Sign In Configuration:');
  console.log('------------------------------------');
  
  // Check required variables
  const requiredVars = {
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_KEY_ID: process.env.APPLE_KEY_ID,
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY
  };
  
  console.log('\nEnvironment Variables:');
  Object.entries(requiredVars).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✓ Present' : '✗ Missing'}`);
    if (value && key !== 'APPLE_PRIVATE_KEY') {
      console.log(`  Value: ${value}`);
    }
  });
  
  // Validate private key format
  if (requiredVars.APPLE_PRIVATE_KEY) {
    console.log('\nPrivate Key Analysis:');
    const key = requiredVars.APPLE_PRIVATE_KEY;
    console.log('Length:', key.length);
    console.log('Has BEGIN header:', key.includes('-----BEGIN PRIVATE KEY-----'));
    console.log('Has END header:', key.includes('-----END PRIVATE KEY-----'));
    
    // Try to generate a client secret
    try {
      const token = jwt.sign({
        iss: requiredVars.APPLE_TEAM_ID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        aud: 'https://appleid.apple.com',
        sub: requiredVars.APPLE_CLIENT_ID
      }, key, {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: requiredVars.APPLE_KEY_ID
        }
      });
      
      console.log('\n✓ Successfully generated client secret!');
      console.log('Token preview:', token.substring(0, 50) + '...');
      
    } catch (error) {
      console.error('\n✗ Failed to generate client secret:', error.message);
      console.log('\nTrying to fix key format...');
      
      // Try to fix the key format
      const cleanKey = key
        .replace(/-----BEGIN [A-Z ]+(KEY-----)/g, '-----BEGIN PRIVATE KEY-----')
        .replace(/-----END [A-Z ]+(KEY-----)/g, '-----END PRIVATE KEY-----')
        .replace(/\\n/g, '\n')
        .replace(/[\r\n\s]+/g, '')
        .match(/.{1,64}/g)
        .join('\n');
      
      const formattedKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
      console.log('\nFormatted key:\n', formattedKey);
      
      try {
        const token = jwt.sign({
          iss: requiredVars.APPLE_TEAM_ID,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 300,
          aud: 'https://appleid.apple.com',
          sub: requiredVars.APPLE_CLIENT_ID
        }, formattedKey, {
          algorithm: 'ES256',
          header: {
            alg: 'ES256',
            kid: requiredVars.APPLE_KEY_ID
          }
        });
        
        console.log('\n✓ Successfully generated client secret with formatted key!');
        console.log('Token preview:', token.substring(0, 50) + '...');
        
        console.log('\nUse this format in your .env file:');
        console.log('APPLE_PRIVATE_KEY="' + formattedKey.replace(/\n/g, '\\n') + '"');
        
      } catch (error2) {
        console.error('\n✗ Still failed with formatted key:', error2.message);
      }
    }
  }
}

validateConfig(); 