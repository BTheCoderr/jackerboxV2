// Google OAuth Configuration Fix Script
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log("=== Google OAuth Configuration Fix ===");

// Get the correct callback URL
const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
const googleCallbackUrl = `${nextAuthUrl}/api/auth/callback/google`;

console.log("\nYour Google OAuth Callback URL should be:");
console.log(googleCallbackUrl);
console.log("\nFollow these steps to fix Google OAuth:");

console.log(`
1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Add the following to "Authorized redirect URIs":
   ${googleCallbackUrl}
4. Make sure your app's domain is added to "Authorized JavaScript origins":
   ${nextAuthUrl}
5. Save your changes
6. Verify your Client ID and Client Secret match what's in your .env file:
   GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID || '[not set]'}
`);

// Check for OAuth pages configuration
const authDirPath = path.join(process.cwd(), 'src', 'app', 'auth');
if (!fs.existsSync(path.join(authDirPath))) {
  console.log("\n⚠️ WARNING: The /auth directory doesn't exist");
  console.log("This could be causing the 404 errors when redirecting after OAuth");
  console.log("\nTo fix this, create the following file:");
  console.log("src/app/auth/page.tsx");
  
  // Generate the content
  const authPageContent = `// src/app/auth/page.tsx
import { redirect } from 'next/navigation';

export default function AuthPage() {
  // Redirect to the login page
  redirect('/auth/login');
}
`;

  console.log("\nWith the content:");
  console.log(authPageContent);
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(authDirPath)) {
    fs.mkdirSync(authDirPath, { recursive: true });
    console.log("\nCreated directory:", authDirPath);
  }
  
  // Write the file
  const authPagePath = path.join(authDirPath, 'page.tsx');
  fs.writeFileSync(authPagePath, authPageContent);
  console.log("✓ Created file:", authPagePath);
}

// Provide instructions for fixing Next.js NextAuth routes
console.log("\n=== Next.js NextAuth Configuration ===");
console.log("Make sure your NextAuth configuration has the correct pages config:");
console.log(`
// In your auth-options.ts file
pages: {
  signIn: '/auth/login',
  error: '/auth/error',
},
`);

console.log("\n=== Phone Authentication ===");
console.log("The phone authentication feature in your app is currently just a placeholder:");
console.log("- It shows an alert but doesn't actually verify the phone number");
console.log("- To implement real phone authentication, you'll need to:");
console.log("  1. Use a service like Twilio, Firebase Auth, or AWS SNS to send SMS codes");
console.log("  2. Implement a verification code input form");
console.log("  3. Verify the code on the server and create a session");

console.log("\n=== Test Login ===");
console.log("You can test logging in with these credentials:");
console.log("Email: test@example.com");
console.log("Password: password123");
console.log("(After running the seed-users.js script)");

console.log("\nRestart your development server after making these changes."); 