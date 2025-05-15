// Auth Debug Script
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log("=== Auth Configuration Debug ===");

// Check NEXTAUTH_URL
const nextAuthUrl = process.env.NEXTAUTH_URL;
console.log(`\nNEXTAUTH_URL: ${nextAuthUrl}`);
if (nextAuthUrl && nextAuthUrl.includes('3002') && process.env.npm_package_scripts_dev && process.env.npm_package_scripts_dev.includes('3001')) {
  console.log("⚠️ WARNING: NEXTAUTH_URL port (3002) doesn't match your dev server port (3001)");
  console.log("→ This will cause OAuth callbacks to fail");
  console.log("→ Fix: Change NEXTAUTH_URL in .env to use port 3001");
}

// Check Google OAuth
console.log("\n=== Google OAuth Configuration ===");
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.log("❌ Missing Google OAuth credentials");
} else {
  console.log(`✓ Google Client ID: ${googleClientId ? "Configured" : "Missing"}`);
  console.log(`✓ Google Client Secret: ${googleClientSecret ? "Configured" : "Missing"}`);
  
  // Try to check credentials format
  if (googleClientId && !googleClientId.includes('.apps.googleusercontent.com')) {
    console.log("⚠️ WARNING: Google Client ID doesn't have expected format (should end with .apps.googleusercontent.com)");
  }
}

// Check Apple OAuth
console.log("\n=== Apple OAuth Configuration ===");
const appleClientId = process.env.APPLE_CLIENT_ID;
const appleTeamId = process.env.APPLE_TEAM_ID;
const appleKeyId = process.env.APPLE_KEY_ID;
const applePrivateKey = process.env.APPLE_PRIVATE_KEY;
const applePrivateKeyPath = process.env.APPLE_PRIVATE_KEY_PATH;

console.log(`Apple Client ID: ${appleClientId ? "Configured" : "Missing"}`);
console.log(`Apple Team ID: ${appleTeamId ? "Configured" : "Missing"}`);
console.log(`Apple Key ID: ${appleKeyId ? "Configured" : "Missing"}`);
console.log(`Apple Private Key: ${applePrivateKey ? "Configured" : "Missing"}`);
console.log(`Apple Private Key Path: ${applePrivateKeyPath ? "Configured" : "Missing"}`);

// Validate Apple private key format
if (applePrivateKey) {
  if (!applePrivateKey.includes('-----BEGIN PRIVATE KEY-----') || !applePrivateKey.includes('-----END PRIVATE KEY-----')) {
    console.log("❌ ERROR: Apple Private Key doesn't have the correct format");
    console.log("→ It should be a PEM-formatted private key");
  }
  
  if (applePrivateKey.includes('\\n')) {
    console.log("⚠️ WARNING: Apple Private Key contains escaped newlines (\\n)");
    console.log("→ For JWT signing, these need to be actual newlines");
    
    // Try to fix the key
    console.log("\nAttempting to fix Apple Private Key format:");
    const fixedKey = applePrivateKey.replace(/\\n/g, '\n');
    console.log(fixedKey);
    
    // Test if the key works for ES256 signing
    try {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { test: 'data' },
        fixedKey,
        { algorithm: 'ES256' }
      );
      console.log("✓ SUCCESS: Fixed key works for ES256 JWT signing");
      
      // Suggest how to fix in .env file
      console.log("\nTo fix your .env file, replace the current APPLE_PRIVATE_KEY with:");
      console.log(`APPLE_PRIVATE_KEY='${fixedKey}'`);
      console.log("Make sure to keep single quotes around the key");
    } catch (error) {
      console.log(`❌ ERROR: Even after fixing newlines, key doesn't work for ES256 signing: ${error.message}`);
    }
  }
}

// Check database connection
console.log("\n=== Database Configuration ===");
const dbUrl = process.env.DATABASE_URL;
console.log(`Database URL: ${dbUrl ? "Configured" : "Missing"}`);

if (dbUrl) {
  // Extract database info
  try {
    const dbParts = new URL(dbUrl);
    console.log(`Database Type: ${dbParts.protocol.replace(':', '')}`);
    console.log(`Database Host: ${dbParts.hostname}`);
    console.log(`Database Name: ${dbParts.pathname.replace('/', '')}`);
    
    // Check if we can connect to the database
    console.log("\nAttempting database connection...");
    try {
      // This is a simple check - won't actually connect to the database,
      // but will verify if the database server is reachable
      const { execSync } = require('child_process');
      execSync(`nc -z -w 5 ${dbParts.hostname} ${dbParts.port || 5432}`);
      console.log("✓ Database server is reachable");
    } catch (error) {
      console.log("❌ ERROR: Could not connect to database server");
      console.log("→ This will cause authentication issues");
    }
  } catch (error) {
    console.log(`❌ ERROR: Could not parse database URL: ${error.message}`);
  }
}

console.log("\n=== Auth and Redirection URLs ===");
const allowedCallbackUrls = [
  `${nextAuthUrl}/api/auth/callback/google`,
  `${nextAuthUrl}/api/auth/callback/apple`,
  `${nextAuthUrl}/api/auth/callback/credentials`
];
console.log("These are the callback URLs that should be configured in OAuth providers:");
allowedCallbackUrls.forEach(url => console.log(`- ${url}`));

console.log("\n=== Next Steps ===");
console.log("1. Restart your server after making any configuration changes");
console.log("2. For Google OAuth: Verify these redirect URIs are configured in Google Cloud Console");
console.log("3. For Apple Sign In: Verify your Services ID and private key are correctly formatted");
console.log("4. Check database connection if credential logins are failing"); 