import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Function to check for special characters in a string
function containsSpecialChars(str: string): boolean {
  const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return specialChars.test(str);
}

// Function to check if a string needs URL encoding
function needsUrlEncoding(str: string): boolean {
  return str !== encodeURIComponent(str);
}

// Main function to check AWS credentials
function checkAwsKey() {
  console.log("AWS Key Check:");
  
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!secretKey) {
    console.log("AWS_SECRET_ACCESS_KEY is not set in the .env file.");
    return;
  }
  
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
  console.log("AWS_SECRET_ACCESS_KEY length:", secretKey.length);
  
  // Check for special characters
  const hasSpecialChars = containsSpecialChars(secretKey);
  console.log("Contains special characters:", hasSpecialChars);
  
  // Check if URL encoding is needed
  const requiresUrlEncoding = needsUrlEncoding(secretKey);
  console.log("Requires URL encoding:", requiresUrlEncoding);
  
  // Check for whitespace
  const hasWhitespace = /\s/.test(secretKey);
  console.log("Contains whitespace:", hasWhitespace);
  
  // Check for non-ASCII characters
  const hasNonAscii = /[^\x00-\x7F]/.test(secretKey);
  console.log("Contains non-ASCII characters:", hasNonAscii);
  
  // Check for line breaks
  const hasLineBreaks = /[\r\n]/.test(secretKey);
  console.log("Contains line breaks:", hasLineBreaks);
  
  // Check if the key starts or ends with whitespace
  const startsWithWhitespace = /^\s/.test(secretKey);
  const endsWithWhitespace = /\s$/.test(secretKey);
  console.log("Starts with whitespace:", startsWithWhitespace);
  console.log("Ends with whitespace:", endsWithWhitespace);
  
  // Create a sanitized version of the key
  const sanitizedKey = secretKey.trim();
  
  if (sanitizedKey !== secretKey) {
    console.log("\nThe AWS secret key contains leading or trailing whitespace!");
    console.log("This is likely causing the SignatureDoesNotMatch error.");
    console.log("\nRecommendation: Update your .env file with the sanitized key.");
    
    // Create a backup of the .env file
    const envPath = path.join(process.cwd(), '.env');
    const backupPath = path.join(process.cwd(), '.env.backup');
    
    try {
      fs.copyFileSync(envPath, backupPath);
      console.log(`\nCreated backup of .env file at ${backupPath}`);
      
      // Read the .env file
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace the AWS secret key with the sanitized version
      const updatedContent = envContent.replace(
        /AWS_SECRET_ACCESS_KEY=.*/,
        `AWS_SECRET_ACCESS_KEY="${sanitizedKey}"`
      );
      
      // Write the updated content back to the .env file
      fs.writeFileSync(envPath, updatedContent);
      console.log("Updated .env file with sanitized AWS secret key.");
      console.log("Please try running the AWS tests again.");
    } catch (error) {
      console.error("Error updating .env file:", error);
    }
  } else {
    console.log("\nThe AWS secret key does not contain leading or trailing whitespace.");
    console.log("\nRecommendation: Try creating a new access key in the AWS IAM console.");
  }
}

// Run the check
checkAwsKey(); 