import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to add export const dynamic = 'force-dynamic' to server components
function addDynamicExport(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file already has the dynamic export
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`File already has dynamic export: ${filePath}`);
    return;
  }

  // Add the dynamic export at the beginning of the file
  content = `export const dynamic = 'force-dynamic';\n\n${content}`;
  
  fs.writeFileSync(filePath, content);
  console.log(`Added dynamic export to: ${filePath}`);
}

// Paths that had dynamic server usage errors
const pathsToFix = [
  'src/app/routes/dashboard/rentals/page.tsx',
  'src/app/routes/admin/payments/page.tsx',
  'src/app/routes/admin/page.tsx',
  'src/app/routes/admin/reports/page.tsx',
  'src/app/routes/equipment/new/page.tsx',
  'src/app/api/stripe/create-connect-account/route.js'
];

// Fix each file
pathsToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  addDynamicExport(fullPath);
});

console.log('Dynamic server usage fix completed!'); 