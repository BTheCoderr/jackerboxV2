import fs from 'fs';
import path from 'path';

// List of UI components to check
const uiComponents = [
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/alert.tsx',
  'src/components/ui/cloudinary-image.tsx',
  'src/components/ui/cloudinary-upload.tsx'
];

// Check if utils.ts has formatDate
const utilsPath = 'src/lib/utils.ts';

console.log('Checking UI components...');

// Check each component
uiComponents.forEach(componentPath => {
  if (fs.existsSync(componentPath)) {
    console.log(`✅ ${componentPath} exists`);
  } else {
    console.log(`❌ ${componentPath} is missing`);
  }
});

// Check utils.ts
if (fs.existsSync(utilsPath)) {
  const utilsContent = fs.readFileSync(utilsPath, 'utf8');
  if (utilsContent.includes('export function formatDate')) {
    console.log(`✅ ${utilsPath} contains formatDate function`);
  } else {
    console.log(`❌ ${utilsPath} is missing formatDate function`);
  }
} else {
  console.log(`❌ ${utilsPath} is missing`);
}

console.log('\nIf any components are missing, please make sure they are created before building.'); 