// fix-dynamic-routes.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to add dynamic export to a file
function addDynamicExport(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file already has dynamic export
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`File already has dynamic export: ${filePath}`);
      return;
    }
    
    // Add dynamic export at the beginning of the file
    console.log(`Adding dynamic export to: ${filePath}`);
    content = `export const dynamic = 'force-dynamic';\n\n${content}`;
    fs.writeFileSync(filePath, content);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Create a dynamic export file for each protected route
function createDynamicExportFiles() {
  const routes = [
    'dashboard',
    'admin',
    'equipment/new',
    'profile',
    'rentals',
    'messages'
  ];
  
  routes.forEach(route => {
    const dirPath = path.join(process.cwd(), 'src', 'app', 'routes', route);
    const filePath = path.join(dirPath, 'dynamic.js');
    
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Create dynamic.js file
      fs.writeFileSync(filePath, "export const dynamic = 'force-dynamic';\n");
      console.log(`Created dynamic export file: ${filePath}`);
    } catch (error) {
      console.error(`Error creating dynamic export file for ${route}:`, error);
    }
  });
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

// Create dynamic export files for protected routes
createDynamicExportFiles();

console.log('Dynamic server usage fix completed!'); 