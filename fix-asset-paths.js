import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find HTML files
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (path.extname(file) === '.html') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix asset paths in HTML files
function fixAssetPaths(htmlFile) {
  let content = fs.readFileSync(htmlFile, 'utf8');
  
  // Fix script src paths
  content = content.replace(/src="\/_next\//g, 'src="/_next/');
  
  // Fix link href paths
  content = content.replace(/href="\/_next\//g, 'href="/_next/');
  
  fs.writeFileSync(htmlFile, content, 'utf8');
  console.log(`Fixed asset paths in ${htmlFile}`);
}

// Copy _redirects file to the out directory
if (fs.existsSync('public/_redirects')) {
  fs.copyFileSync('public/_redirects', 'out/_redirects');
  console.log('Copied _redirects file to out directory');
}

// Copy 404.html to the out directory
if (fs.existsSync('public/404.html')) {
  fs.copyFileSync('public/404.html', 'out/404.html');
  console.log('Copied 404.html file to out directory');
}

// Find and fix all HTML files
const htmlFiles = findHtmlFiles('out');
htmlFiles.forEach(fixAssetPaths);

console.log(`Fixed asset paths in ${htmlFiles.length} HTML files`);
