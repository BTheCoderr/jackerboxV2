// This script helps generate a properly formatted Apple private key file
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const credentialsDir = path.join(rootDir, 'credentials');
const privateKeyPath = path.join(credentialsDir, 'apple-private-key.p8');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function ensureCredentialsDir() {
  try {
    await fs.mkdir(credentialsDir, { recursive: true });
    console.log(`Created credentials directory at ${credentialsDir}`);
  } catch (error) {
    console.log(`Credentials directory already exists at ${credentialsDir}`);
  }
}

function getKeyFromInput() {
  return new Promise((resolve) => {
    console.log('\nPlease paste your Apple private key below.');
    console.log('It should start with -----BEGIN PRIVATE KEY----- and end with -----END PRIVATE KEY-----');
    console.log('Press Enter twice when done.\n');
    
    let key = '';
    let emptyLineCount = 0;
    
    rl.on('line', (line) => {
      if (line.trim() === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
          rl.close();
          resolve(key);
        }
      } else {
        emptyLineCount = 0;
        key += line + '\n';
      }
    });
  });
}

function getKeyFromEnv() {
  const key = process.env.APPLE_PRIVATE_KEY;
  if (!key) {
    console.log('No APPLE_PRIVATE_KEY found in .env file');
    return null;
  }
  
  // Clean up the key
  return key
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
    .trim();
}

async function writeKeyToFile(key) {
  // Ensure the key has the correct format
  if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
    key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
  }
  
  try {
    await fs.writeFile(privateKeyPath, key, 'utf8');
    console.log(`Private key written to ${privateKeyPath}`);
    
    // Update .env file to use the file path
    console.log('\nUpdate your .env file with:');
    console.log('APPLE_PRIVATE_KEY_PATH="credentials/apple-private-key.p8"');
    
    return true;
  } catch (error) {
    console.error('Error writing private key to file:', error);
    return false;
  }
}

async function main() {
  try {
    await ensureCredentialsDir();
    
    // Try to get key from environment variable
    console.log('Checking for APPLE_PRIVATE_KEY in .env file...');
    let key = getKeyFromEnv();
    
    // If not found, prompt for key
    if (!key) {
      key = await getKeyFromInput();
    } else {
      console.log('Found APPLE_PRIVATE_KEY in .env file');
    }
    
    if (!key) {
      console.error('No private key provided');
      process.exit(1);
    }
    
    const success = await writeKeyToFile(key);
    if (success) {
      console.log('\nNow update the auth-options.ts to read from file instead of env var');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

main(); 