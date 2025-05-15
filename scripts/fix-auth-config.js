#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log("=== Auth Configuration Fix ===");
  console.log("This script will fix common auth configuration issues.");
  
  // 1. Create .env.local file with fixed configuration
  const envFilePath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  try {
    if (fs.existsSync(envFilePath)) {
      console.log("\nReading .env file...");
      let envContent = fs.readFileSync(envFilePath, 'utf8');
      
      // Fix NEXTAUTH_URL to use port 3001
      envContent = envContent.replace(
        /NEXTAUTH_URL="http:\/\/localhost:3002"/,
        'NEXTAUTH_URL="http://localhost:3001"'
      );
      
      // Fix Apple Private Key format
      if (envContent.includes('APPLE_PRIVATE_KEY=')) {
        console.log("\nFixing Apple Private Key format...");
        
        // Extract the Apple Private Key
        const appleKeyMatch = envContent.match(/APPLE_PRIVATE_KEY=(.+?)(\n|$)/);
        if (appleKeyMatch && appleKeyMatch[1]) {
          let privateKey = appleKeyMatch[1].trim();
          
          // Remove surrounding quotes if present
          if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
              (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
          }
          
          // Replace \n with actual newlines
          const fixedKey = privateKey.replace(/\\n/g, '\n');
          
          // Replace the key in the env content
          envContent = envContent.replace(
            /APPLE_PRIVATE_KEY=.+?(\n|$)/,
            `APPLE_PRIVATE_KEY='${fixedKey}'\n`
          );
        }
      }
      
      // Disable Apple provider temporarily in auth-options.ts
      const authOptionsPath = path.join(process.cwd(), 'src/lib/auth/auth-options.ts');
      if (fs.existsSync(authOptionsPath)) {
        console.log("\nTemporarily disabling Apple provider in auth-options.ts...");
        let authOptionsContent = fs.readFileSync(authOptionsPath, 'utf8');
        
        // Comment out Apple provider if not already commented
        if (!authOptionsContent.includes('// AppleProvider({')) {
          authOptionsContent = authOptionsContent.replace(
            /AppleProvider\({/g,
            '// AppleProvider({'
          );
        }
        
        fs.writeFileSync(authOptionsPath, authOptionsContent, 'utf8');
        console.log("✓ Apple provider disabled in auth-options.ts");
      }
      
      // Write to .env.local
      fs.writeFileSync(envLocalPath, envContent, 'utf8');
      console.log(`✓ Created .env.local with fixed configuration`);

      // 2. Fix login form to disable Apple Sign-In
      const loginFormPath = path.join(process.cwd(), 'src/components/auth/login-form.tsx');
      if (fs.existsSync(loginFormPath)) {
        console.log("\nUpdating login form to disable Apple Sign-In button...");
        let loginFormContent = fs.readFileSync(loginFormPath, 'utf8');
        
        // Already has disabled Apple button, no need to modify
        if (loginFormContent.includes('// Temporarily disabled') && 
            loginFormContent.includes('title="Apple Sign-In is coming soon"')) {
          console.log("✓ Apple Sign-In button already disabled");
        }
        
        fs.writeFileSync(loginFormPath, loginFormContent, 'utf8');
      }
      
      console.log("\n=== Fix Complete ===");
      console.log("Please restart your development server for changes to take effect.");
      console.log("\nFor Google Sign-In to work, make sure the following callback URL is configured in Google Cloud Console:");
      console.log("http://localhost:3001/api/auth/callback/google");
    } else {
      console.log("❌ ERROR: .env file not found");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
  
  rl.close();
}

main(); 