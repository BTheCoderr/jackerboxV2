import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Determine the root directory
const rootDir = path.resolve(process.cwd());
console.log(`Preparing Jackerbox for Vercel deployment from ${rootDir}...`);

// Function to add dynamic export to a file if it doesn't already have it
function addDynamicExport(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`File already has dynamic export: ${filePath}`);
    return;
  }

  console.log(`Adding dynamic export to: ${filePath}`);
  const updatedContent = `export const dynamic = 'force-dynamic';\n\n${content}`;
  fs.writeFileSync(filePath, updatedContent);
}

// Check if .env.production exists, if not create it from .env
const envProductionPath = path.join(rootDir, '.env.production');
if (!fs.existsSync(envProductionPath)) {
  console.log('Creating .env.production from .env...');
  const envContent = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
  fs.writeFileSync(envProductionPath, envContent);
  console.log('.env.production created successfully.');
}

// Test database connection
console.log('Testing database connection...');
try {
  execSync('npx prisma db pull', { stdio: 'inherit' });
  console.log('Database connection successful!');
} catch (error) {
  console.error('Database connection failed:', error.message);
  process.exit(1);
}

// Add dynamic exports to server component files that need it
const serverComponentFiles = [
  'src/app/routes/admin/users/page.tsx',
  'src/app/routes/admin/equipment/page.tsx',
  'src/app/routes/admin/rentals/page.tsx',
  'src/app/routes/admin/payments/page.tsx',
  'src/app/routes/admin/page.tsx',
  'src/app/routes/admin/reports/page.tsx',
  'src/app/routes/dashboard/rentals/page.tsx',
  'src/app/routes/equipment/new/page.tsx'
];

console.log('Adding dynamic exports to server component files...');
serverComponentFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  addDynamicExport(filePath);
});

// Update next.config.mjs for Vercel
console.log('Updating next.config.mjs for Vercel...');
const nextConfigPath = path.join(rootDir, 'next.config.mjs');
let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

// Remove standalone output setting if present
nextConfig = nextConfig.replace(/output:\s*['"]standalone['"],?\n?/g, '');

// Ensure images are configured correctly
if (!nextConfig.includes('domains: [\'res.cloudinary.com\']')) {
  nextConfig = nextConfig.replace(
    /images:\s*{[^}]*}/,
    `images: {
    domains: ['res.cloudinary.com'],
    unoptimized: false,
  }`
  );
}

fs.writeFileSync(nextConfigPath, nextConfig);
console.log('next.config.mjs updated successfully.');

// Create or update vercel.json
console.log('Creating vercel.json...');
const vercelConfig = {
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sfo1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
};

fs.writeFileSync(path.join(rootDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
console.log('vercel.json created successfully.');

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully.');
} catch (error) {
  console.error('Failed to generate Prisma client:', error.message);
}

console.log('\nApplication is ready for Vercel deployment!');
console.log('\nNext steps:');
console.log('1. Push your changes to GitHub');
console.log('2. Create a new project on Vercel and import your repository');
console.log('3. Set up the following environment variables on Vercel:');
console.log('   - DATABASE_URL');
console.log('   - DIRECT_DATABASE_URL');
console.log('   - NEXTAUTH_URL (set to your Vercel deployment URL)');
console.log('   - NEXTAUTH_SECRET');
console.log('   - All other environment variables from your .env file');
console.log('4. Deploy your application'); 