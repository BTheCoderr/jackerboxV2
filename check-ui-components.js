import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the components to check
const components = [
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/alert.tsx',
  'src/components/ui/cloudinary-image.tsx',
  'src/components/ui/cloudinary-upload.tsx',
  'src/lib/utils.ts'
];

// Check if each component exists
console.log('Checking UI components...');
let allComponentsExist = true;

components.forEach(componentPath => {
  const fullPath = path.join(process.cwd(), componentPath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${componentPath} exists`);
    
    // Check if the file has the correct imports
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (componentPath.includes('ui/') && !content.includes('@/lib/utils')) {
      console.log(`❌ ${componentPath} is missing the import from @/lib/utils`);
      allComponentsExist = false;
    }
  } else {
    console.log(`❌ ${componentPath} does not exist`);
    allComponentsExist = false;
  }
});

// Create the components directory structure if it doesn't exist
if (!allComponentsExist) {
  console.log('\nCreating missing components...');
  
  // Ensure directories exist
  const directories = [
    'src/components/ui',
    'src/lib'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  console.log('\nPlease run the setup-ui.sh script to create the components:');
  console.log('chmod +x setup-ui.sh && ./setup-ui.sh');
} else {
  console.log('\nAll UI components exist and are correctly configured! 🎉');
}

// Exit with appropriate code
process.exit(allComponentsExist ? 0 : 1); 