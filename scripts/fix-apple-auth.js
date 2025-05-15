#!/usr/bin/env node

/**
 * This script helps set up and fix Apple Sign-In authentication
 * It handles:
 * 1. Creating proper key files
 * 2. Testing key formats
 * 3. Providing guidance on resolving common issues
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const CREDENTIALS_DIR = path.join(__dirname, '..', 'credentials');
const APPLE_KEY_PATH = path.join(CREDENTIALS_DIR, 'apple-private-key.p8');

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✓ Directory exists: ${dir}`);
  } catch (error) {
    console.error(`✗ Error creating directory ${dir}:`, error);
    process.exit(1);
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  const requiredVars = [
    'APPLE_TEAM_ID',
    'APPLE_CLIENT_ID',
    'APPLE_KEY_ID'
  ];
  
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✓ ${varName} is set to: ${process.env[varName]}`);
    }
  }
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.log('Please add these to your .env file.');
    
    const shouldContinue = await question('\nContinue anyway? (y/n): ');
    if (shouldContinue.toLowerCase() !== 'y') {
      process.exit(1);
    }
  } else {
    console.log('✓ All required environment variables are set.');
  }
}

async function getAppleKey() {
  console.log('\n🔑 Checking for Apple private key...');
  
  try {
    // Check if key file exists
    await fs.access(APPLE_KEY_PATH);
    const keyData = await fs.readFile(APPLE_KEY_PATH, 'utf8');
    console.log(`✓ Found existing key at ${APPLE_KEY_PATH}`);
    return keyData;
  } catch (error) {
    // Key file doesn't exist
    console.log(`✗ No key file found at ${APPLE_KEY_PATH}`);
    
    // Check if the key is in the environment
    if (process.env.APPLE_PRIVATE_KEY) {
      console.log('✓ Found key in APPLE_PRIVATE_KEY environment variable');
      const keyData = process.env.APPLE_PRIVATE_KEY
        .replace(/\\n/g, '\n')
        .replace(/^['"]|['"]$/g, '');
      
      // Save the key to the credentials directory
      await fs.writeFile(APPLE_KEY_PATH, keyData, 'utf8');
      console.log(`✓ Saved key to ${APPLE_KEY_PATH}`);
      return keyData;
    }
    
    // No key found anywhere, ask the user to provide one
    console.log('\n⚠️  No Apple private key found.');
    console.log('Please download a private key from the Apple Developer Portal.');
    console.log('1. Go to https://developer.apple.com/account/resources/authkeys/list');
    console.log('2. Create a new key with "Sign In with Apple" enabled');
    console.log('3. Download the .p8 file and provide the path below');
    
    const keyPath = await question('\nPath to your .p8 file: ');
    if (!keyPath) {
      console.error('No key file provided. Exiting.');
      process.exit(1);
    }
    
    try {
      const keyData = await fs.readFile(keyPath, 'utf8');
      await fs.writeFile(APPLE_KEY_PATH, keyData, 'utf8');
      console.log(`✓ Copied key from ${keyPath} to ${APPLE_KEY_PATH}`);
      return keyData;
    } catch (error) {
      console.error(`✗ Error reading key file: ${error.message}`);
      process.exit(1);
    }
  }
}

async function validateKeyFormat(keyData) {
  console.log('\n🔍 Validating key format...');
  
  // Check if the key has proper PEM format
  const hasPemHeader = keyData.includes('-----BEGIN PRIVATE KEY-----');
  const hasPemFooter = keyData.includes('-----END PRIVATE KEY-----');
  
  if (!hasPemHeader || !hasPemFooter) {
    console.log('⚠️  Key is not in proper PEM format.');
    console.log('  - Has header:', hasPemHeader);
    console.log('  - Has footer:', hasPemFooter);
    
    // Try to fix the key format
    console.log('\n🔧 Attempting to fix key format...');
    
    // Remove any existing headers/footers and whitespace
    const cleanKey = keyData
      .replace(/-----BEGIN[^-]*-----/g, '')
      .replace(/-----END[^-]*-----/g, '')
      .replace(/[\r\n\s]+/g, '');
    
    // Format as PEM
    const formattedKey = `-----BEGIN PRIVATE KEY-----\n${
      cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey
    }\n-----END PRIVATE KEY-----`;
    
    // Save the fixed key
    await fs.writeFile(APPLE_KEY_PATH, formattedKey, 'utf8');
    console.log(`✓ Saved fixed key to ${APPLE_KEY_PATH}`);
    
    return formattedKey;
  }
  
  console.log('✓ Key appears to be in proper PEM format');
  return keyData;
}

async function updateAuthOptionsFile() {
  console.log('\n📝 Updating auth-options.ts file...');
  
  // Re-enable Apple provider in auth-options.ts
  const authOptionsPath = path.join(__dirname, '..', 'src', 'lib', 'auth', 'auth-options.ts');
  
  try {
    let authOptionsContent = await fs.readFile(authOptionsPath, 'utf8');
    
    // Replace the commented-out Apple provider with an active one
    const uncommentedProvider = authOptionsContent.replace(
      /\/\/ AppleProvider disabled until key issues are resolved\s*\/\/ AppleProvider\({[\s\S]*?\/\/   \},\s*\/\/   \}\),/g,
      `AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: generateAppleClientSecret(),
      authorization: {
        params: {
          response_type: 'code',
          response_mode: 'form_post',
          scope: 'name email',
        },
      },
    }),`
    );
    
    await fs.writeFile(authOptionsPath, uncommentedProvider, 'utf8');
    console.log('✓ Updated auth-options.ts to enable Apple provider');
  } catch (error) {
    console.log('⚠️  Could not update auth-options.ts file');
    console.error(error);
  }
}

async function updateLoginForm() {
  console.log('\n📝 Updating login-form.tsx file...');
  
  // Re-enable Apple button in login-form.tsx
  const loginFormPath = path.join(__dirname, '..', 'src', 'components', 'auth', 'login-form.tsx');
  
  try {
    let loginFormContent = await fs.readFile(loginFormPath, 'utf8');
    
    // Replace the disabled Apple button with an active one
    const updatedContent = loginFormContent.replace(
      /\/\/ Temporarily disabled\s*\/\/ onClick={\(\) => signIn\("apple", { callbackUrl: "\/" }\)}/,
      `onClick={() => signIn("apple", { callbackUrl: "/" })}`
    );
    
    const updatedContent2 = updatedContent.replace(
      /className="flex items-center justify-center py-2 px-4 border rounded-md hover:bg-gray-50 transition-colors opacity-60 cursor-not-allowed"\s*disabled\s*title="Apple Sign-In is coming soon"/,
      `className="flex items-center justify-center py-2 px-4 border rounded-md hover:bg-gray-50 transition-colors"`
    );
    
    const finalContent = updatedContent2.replace(
      /Apple \(Soon\)/,
      `Apple`
    );
    
    await fs.writeFile(loginFormPath, finalContent, 'utf8');
    console.log('✓ Updated login-form.tsx to enable Apple button');
  } catch (error) {
    console.log('⚠️  Could not update login-form.tsx file');
    console.error(error);
  }
}

async function main() {
  console.log('🍎 Apple Sign-In Setup Script');
  console.log('============================');
  
  try {
    // Create the credentials directory if it doesn't exist
    await ensureDirectoryExists(CREDENTIALS_DIR);
    
    // Check environment variables
    await checkEnvironmentVariables();
    
    // Get the Apple private key
    const keyData = await getAppleKey();
    
    // Validate and fix the key format if needed
    const validatedKey = await validateKeyFormat(keyData);
    
    // Test the key by trying to calculate a signature
    try {
      console.log('\n🔐 Testing key by calculating a signature...');
      const sign = crypto.createSign('RSA-SHA256');
      sign.update('test data');
      sign.end();
      sign.sign(validatedKey, 'base64');
      console.log('✓ Successfully signed test data with the key');
    } catch (error) {
      console.log(`✗ Failed to sign test data: ${error.message}`);
      console.log('The key may be invalid or in an unsupported format.');
    }
    
    // Update auth-options.ts to re-enable Apple provider
    const enableProvider = await question('\nDo you want to enable Apple Sign-In now? (y/n): ');
    if (enableProvider.toLowerCase() === 'y') {
      await updateAuthOptionsFile();
      await updateLoginForm();
    }
    
    console.log('\n✅ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with:');
    console.log('   APPLE_PRIVATE_KEY_PATH="credentials/apple-private-key.p8"');
    console.log('2. Restart your development server');
    console.log('3. Test Apple Sign-In functionality');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

main(); 