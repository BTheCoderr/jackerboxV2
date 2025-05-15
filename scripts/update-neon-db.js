// Script to update database connection to Neon
const fs = require('fs');
const path = require('path');

// Correct Neon database connection string from screenshot
const neonConnection = "postgresql://jackerboxDB_owner:npg_vYM7Pg4ERIAk@ep-fancy-wind-a5ymnajb-pooler.us-east-2.aws.neon.tech/jackerboxDB?sslmode=require";

console.log("Updating database connection to Neon...");

// Path to the .env.local file
const envLocalPath = path.join(process.cwd(), '.env.local');

try {
  let content = '';
  
  // Read current file if exists or create a new one
  if (fs.existsSync(envLocalPath)) {
    content = fs.readFileSync(envLocalPath, 'utf8');
    
    // Update DATABASE_URL
    if (content.includes('DATABASE_URL=')) {
      content = content.replace(/DATABASE_URL=.*$/m, `DATABASE_URL="${neonConnection}"`);
    } else {
      content += `\nDATABASE_URL="${neonConnection}"`;
    }
    
    // Update DIRECT_DATABASE_URL
    if (content.includes('DIRECT_DATABASE_URL=')) {
      content = content.replace(/DIRECT_DATABASE_URL=.*$/m, `DIRECT_DATABASE_URL="${neonConnection}"`);
    } else {
      content += `\nDIRECT_DATABASE_URL="${neonConnection}"`;
    }
  } else {
    // Create new content with Neon connection
    content = `# Database configuration - Neon PostgreSQL
DATABASE_URL="${neonConnection}"
DIRECT_DATABASE_URL="${neonConnection}"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="b47d57c8e07eb57ef77d7cb9fa8412d6cd40b19a31ce00f2bb763a83ba4c8d1b"

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL="https://prime-ostrich-21240.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AVL4AAIjcDExMjE2ZjY5ZTdmMmQ0NWI5OTg4YzNmYzU3NGEwNTdhYnAxMA"
KV_URL="rediss://default:AVL4AAIjcDExMjE2ZjY5ZTdmMmQ0NWI5OTg4YzNmYzU3NGEwNTdhYnAxMA@prime-ostrich-21240.upstash.io:6379"
`;
  }
  
  // Write updated content to .env.local
  fs.writeFileSync(envLocalPath, content);
  console.log("✓ Updated .env.local with Neon database connection");
  
  // Now also create/update .env.neon with just the database connection
  const envNeonPath = path.join(process.cwd(), '.env.neon');
  const neonContent = `DATABASE_URL="${neonConnection}"
DIRECT_DATABASE_URL="${neonConnection}"
`;
  fs.writeFileSync(envNeonPath, neonContent);
  console.log("✓ Created .env.neon with database connection only");
  
  console.log("\nNext steps:");
  console.log("1. Restart your development server");
  console.log("2. Push the schema to the database: npx prisma db push");
  console.log("3. Seed the database: node scripts/seed-users.js");
  
} catch (error) {
  console.error("Error updating environment files:", error);
} 