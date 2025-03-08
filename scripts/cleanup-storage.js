import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Directories to clean
const DIRS_TO_CLEAN = [
  '.next',
  'out',
  '.vercel',
  '.netlify',
  'node_modules/.cache',
  '.turbo',
  'coverage',
  'prisma/dev.db',
  'prisma/dev.db-journal',
  'tmp',
  '.temp'
];

// Files to clean
const FILES_TO_CLEAN = [
  'yarn-error.log',
  'npm-debug.log',
  '.DS_Store'
];

console.log('🧹 Starting storage cleanup...');

// Get project root directory
const rootDir = process.cwd();
console.log(`Project root: ${rootDir}`);

// Calculate initial size
let initialSize = 0;
try {
  const output = execSync('du -sh .', { encoding: 'utf8' });
  initialSize = output.trim().split('\t')[0];
  console.log(`Initial project size: ${initialSize}`);
} catch (error) {
  console.log('Could not determine initial size');
}

// Clean directories
for (const dir of DIRS_TO_CLEAN) {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    try {
      if (dir === 'node_modules/.cache') {
        console.log(`Cleaning ${dir}...`);
        fs.rmSync(dirPath, { recursive: true, force: true });
        fs.mkdirSync(dirPath, { recursive: true });
      } else {
        console.log(`Cleaning ${dir}...`);
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`Error cleaning ${dir}: ${error.message}`);
    }
  }
}

// Clean files
for (const file of FILES_TO_CLEAN) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    try {
      console.log(`Removing ${file}...`);
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Error removing ${file}: ${error.message}`);
    }
  }
}

// Run git garbage collection if .git exists
if (fs.existsSync(path.join(rootDir, '.git'))) {
  try {
    console.log('Running git garbage collection...');
    execSync('git gc --aggressive --prune=now', { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error during git garbage collection: ${error.message}`);
  }
}

// Calculate final size
try {
  const output = execSync('du -sh .', { encoding: 'utf8' });
  const finalSize = output.trim().split('\t')[0];
  console.log(`\nFinal project size: ${finalSize} (was ${initialSize})`);
} catch (error) {
  console.log('Could not determine final size');
}

console.log('\n✅ Storage cleanup complete!');
console.log('\nTo free up even more space, consider:');
console.log('1. Running "npm prune --production" to remove dev dependencies');
console.log('2. Using a shallow clone of the repository');
console.log('3. Setting up a .gitignore for large files');
console.log('4. Using Cloudinary for all image storage instead of local files'); 