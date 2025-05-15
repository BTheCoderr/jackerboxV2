import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Function to get Apple private key
const getApplePrivateKey = (): string => {
  // First check if we have a file path
  const keyPath = process.env.APPLE_PRIVATE_KEY_PATH;
  
  if (keyPath) {
    try {
      // Resolve path relative to project root
      const resolvedPath = path.resolve(process.cwd(), keyPath);
      console.log(`Reading Apple private key from ${resolvedPath}`);
      
      // Read the key file
      const key = fs.readFileSync(resolvedPath, 'utf8');
      if (key) return key.trim();
    } catch (error) {
      console.error(`Error reading Apple private key from ${keyPath}:`, error);
    }
  }
  
  // Fall back to environment variable
  return process.env.APPLE_PRIVATE_KEY || '';
};

// Function to format private key
const formatPrivateKey = (key: string): string => {
  if (!key) return '';
  
  // Strip quotes and cleanup
  key = key.replace(/^["']|["']$/g, '').trim();
  
  // If the key is already in PEM format, return it
  if (key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('-----END PRIVATE KEY-----')) {
    return key;
  }
  
  // If the key is in EC format, return it
  if (key.includes('-----BEGIN EC PRIVATE KEY-----') && key.includes('-----END EC PRIVATE KEY-----')) {
    return key;
  }
  
  // Remove any headers/footers that might be malformed
  let cleanKey = key
    .replace(/-----BEGIN[^-]*-----/g, '')
    .replace(/-----END[^-]*-----/g, '')
    .replace(/[\r\n\s]+/g, '');
  
  // Try to format as PEM
  try {
    const formattedKey = `-----BEGIN PRIVATE KEY-----\n${
      cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey
    }\n-----END PRIVATE KEY-----`;
    
    return formattedKey;
  } catch (error) {
    console.error('Failed to format private key:', error);
    throw new Error('Invalid private key format');
  }
};

export async function GET() {
  try {
    // Get environment variables
    const clientId = process.env.APPLE_CLIENT_ID;
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    
    // Return info about environment variables
    const envInfo = {
      clientId: clientId || 'Missing',
      teamId: teamId || 'Missing',
      keyId: keyId || 'Missing',
      privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH || 'Missing',
      privateKeyInEnv: !!process.env.APPLE_PRIVATE_KEY
    };
    
    // Get raw key
    const rawKey = getApplePrivateKey();
    
    if (!rawKey) {
      return NextResponse.json({
        error: 'Missing private key',
        environment: envInfo
      }, { status: 400 });
    }
    
    // Basic key info
    const keyInfo = {
      length: rawKey.length,
      hasPKHeader: rawKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasPKFooter: rawKey.includes('-----END PRIVATE KEY-----'),
      firstLine: rawKey.split('\n')[0],
      lineCount: rawKey.split('\n').length
    };
    
    // Try to sign a simple payload with both algorithms
    let testResults = {
      rs256: { success: false, error: null },
      es256: { success: false, error: null }
    };
    
    try {
      const rs256Token = jwt.sign(
        { test: true },
        rawKey,
        { algorithm: 'RS256' }
      );
      testResults.rs256 = { success: true, token: rs256Token.substring(0, 20) + '...' };
    } catch (error) {
      testResults.rs256 = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    try {
      const es256Token = jwt.sign(
        { test: true },
        rawKey,
        { algorithm: 'ES256' }
      );
      testResults.es256 = { success: true, token: es256Token.substring(0, 20) + '...' };
    } catch (error) {
      testResults.es256 = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    return NextResponse.json({
      environment: envInfo,
      keyInfo,
      testResults
    });

  } catch (error) {
    console.error('Apple Sign In test error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error : undefined,
    }, { status: 500 });
  }
} 