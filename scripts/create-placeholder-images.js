import fs from 'fs';
import path from 'path';

// Define the placeholder SVG content
const placeholderSvg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#f0f0f0"/>
  <text x="400" y="300" font-family="Arial" font-size="32" text-anchor="middle" fill="#888888">No Image Available</text>
  <rect x="250" y="330" width="300" height="5" fill="#cccccc"/>
</svg>`;

// Define the placeholder avatar SVG content
const placeholderAvatarSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="100" fill="#e0e0e0"/>
  <circle cx="100" cy="85" r="40" fill="#a0a0a0"/>
  <circle cx="100" cy="190" r="70" fill="#a0a0a0"/>
</svg>`;

// Define the question mark SVG content
const questionMarkSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#000000"/>
  <text x="50" y="65" font-family="Arial" font-size="70" text-anchor="middle" fill="#00AEEF">?</text>
</svg>`;

// Create the placeholder images
async function createPlaceholderImages() {
  console.log('Creating placeholder images...');
  
  // Create the images directory if it doesn't exist
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created images directory');
  }
  
  // Create the placeholder.svg file
  const placeholderPath = path.join(imagesDir, 'placeholder.svg');
  fs.writeFileSync(placeholderPath, placeholderSvg);
  console.log('Created placeholder.svg');
  
  // Create the placeholder-avatar.svg file
  const placeholderAvatarPath = path.join(imagesDir, 'placeholder-avatar.svg');
  fs.writeFileSync(placeholderAvatarPath, placeholderAvatarSvg);
  console.log('Created placeholder-avatar.svg');
  
  // Create the question-mark.svg file
  const questionMarkPath = path.join(imagesDir, 'question-mark.svg');
  fs.writeFileSync(questionMarkPath, questionMarkSvg);
  console.log('Created question-mark.svg');
  
  // Create a PNG version of the placeholder
  try {
    // Create a simple HTML file with the SVG
    const placeholderPngPath = path.join(imagesDir, 'placeholder.png');
    
    // If we don't have a PNG already, copy a placeholder PNG
    if (!fs.existsSync(placeholderPngPath)) {
      console.log('Note: For PNG versions, you may want to convert the SVGs to PNGs using an image editor.');
    }
  } catch (error) {
    console.error('Error creating PNG version:', error);
  }
  
  console.log('Placeholder images created successfully!');
}

// Run the function
createPlaceholderImages(); 