#!/usr/bin/env node

/**
 * This script prepares the application for deployment to Netlify
 * It:
 * 1. Checks the database connection
 * 2. Ensures all environment variables are set
 * 3. Updates the Next.js configuration for Netlify
 * 4. Adds dynamic exports to server components
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Preparing application for Netlify deployment...');

// Check if .env.production exists
if (!fs.existsSync(path.join(rootDir, '.env.production'))) {
  console.log('Creating .env.production from .env...');
  fs.copyFileSync(path.join(rootDir, '.env'), path.join(rootDir, '.env.production'));
}

// Check database connection
console.log('Testing database connection...');
try {
  execSync('npx prisma db pull', { stdio: 'inherit' });
  console.log('✅ Database connection successful');
} catch (error) {
  console.error('❌ Database connection failed. Please check your DATABASE_URL in .env.production');
  process.exit(1);
}

// Add dynamic exports to server components
console.log('Adding dynamic exports to server components...');
const serverComponentPaths = [
  'src/app/routes/admin/users/page.tsx',
  'src/app/routes/admin/equipment/page.tsx',
  'src/app/routes/admin/rentals/page.tsx',
  'src/app/routes/admin/page.tsx',
  'src/app/routes/admin/reports/page.tsx',
  'src/app/routes/equipment/new/page.tsx',
];

serverComponentPaths.forEach(filePath => {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if the file already has the dynamic export
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`Adding dynamic export to ${filePath}`);
      content = `export const dynamic = 'force-dynamic';\n\n${content}`;
      fs.writeFileSync(fullPath, content);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

// Update next.config.mjs for Netlify
console.log('Updating Next.js configuration for Netlify...');
const nextConfigPath = path.join(rootDir, 'next.config.mjs');
let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

// Ensure output is set to standalone
if (!nextConfig.includes("output: 'standalone'")) {
  nextConfig = nextConfig.replace(
    'const nextConfig = {',
    'const nextConfig = {\n  output: \'standalone\','
  );
}

// Ensure images are configured correctly
if (!nextConfig.includes('domains: [\'res.cloudinary.com\']')) {
  nextConfig = nextConfig.replace(
    'const nextConfig = {',
    'const nextConfig = {\n  images: {\n    domains: [\'res.cloudinary.com\'],\n    unoptimized: true,\n  },'
  );
}

fs.writeFileSync(nextConfigPath, nextConfig);

// Create or update netlify.toml
console.log('Creating Netlify configuration...');
const netlifyConfig = `[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"

# Handle Next.js routing
[[redirects]]
  from = "/*"
  to = "/_next/static/:splat"
  status = 200
  force = true
  conditions = {Path = "/_next/static/*"}

[[redirects]]
  from = "/*"
  to = "/api/:splat"
  status = 200
  force = true
  conditions = {Path = "/api/*"}

[[redirects]]
  from = "/*"
  to = "/:splat"
  status = 200

[functions]
  node_bundler = "esbuild"
`;

fs.writeFileSync(path.join(rootDir, 'netlify.toml'), netlifyConfig);

console.log('✅ Application is ready for Netlify deployment!');
console.log('');
console.log('Next steps:');
console.log('1. Run "npm run build" to build the application');
console.log('2. Deploy to Netlify using the Netlify CLI or GitHub integration');
console.log('');
console.log('For more information, see the Netlify documentation:');
console.log('https://docs.netlify.com/integrations/frameworks/next-js/'); 