#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🧹 Large Files Cleanup Tool');
console.log('==========================');
console.log('This tool will help identify and clean up large files in your project.');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentDir = path.resolve(__dirname, '..');

// Size thresholds in bytes
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
const VERY_LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB

// File types to check for optimization
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];

// Directories to exclude
const EXCLUDE_DIRS = [
  '.git',
  'node_modules',
  '.next',
  'build',
  'dist',
  '.cache'
];

// Find large files in the project
function findLargeFiles(directory, threshold = LARGE_FILE_THRESHOLD) {
  console.log(`\n🔍 Scanning for files larger than ${Math.round(threshold / (1024 * 1024))}MB...`);
  
  const largeFiles = [];
  
  function scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        
        try {
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            // Skip excluded directories
            if (EXCLUDE_DIRS.includes(file)) {
              continue;
            }
            
            scanDirectory(filePath);
          } else if (stats.size > threshold) {
            largeFiles.push({
              path: filePath,
              size: stats.size,
              extension: path.extname(file).toLowerCase()
            });
          }
        } catch (err) {
          // Skip files we can't access
        }
      }
    } catch (err) {
      console.error(`Error scanning directory ${dir}:`, err.message);
    }
  }
  
  scanDirectory(directory);
  
  // Sort by size (largest first)
  return largeFiles.sort((a, b) => b.size - a.size);
}

// Format file size for display
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}

// Get file category based on extension
function getFileCategory(extension) {
  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'Image';
  } else if (VIDEO_EXTENSIONS.includes(extension)) {
    return 'Video';
  } else if (AUDIO_EXTENSIONS.includes(extension)) {
    return 'Audio';
  } else if (DOCUMENT_EXTENSIONS.includes(extension)) {
    return 'Document';
  } else if (extension === '.json') {
    return 'JSON';
  } else if (extension === '.log') {
    return 'Log';
  } else if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(extension)) {
    return 'Archive';
  } else {
    return 'Other';
  }
}

// Check if a file is in .gitignore
function isInGitignore(filePath) {
  try {
    const relativePath = path.relative(currentDir, filePath).replace(/\\/g, '/');
    const result = execSync(`git check-ignore "${relativePath}"`, { stdio: 'pipe' }).toString().trim();
    return result === relativePath;
  } catch (error) {
    return false;
  }
}

// Add a file to .gitignore
function addToGitignore(filePath) {
  try {
    const relativePath = path.relative(currentDir, filePath).replace(/\\/g, '/');
    const gitignorePath = path.join(currentDir, '.gitignore');
    
    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf8');
      if (!content.endsWith('\n')) {
        content += '\n';
      }
    }
    
    // Add the file to .gitignore
    content += relativePath + '\n';
    fs.writeFileSync(gitignorePath, content);
    
    return true;
  } catch (error) {
    console.error('Error adding to .gitignore:', error.message);
    return false;
  }
}

// Optimize an image file
function optimizeImage(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  
  try {
    // Create a backup
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    
    // Optimize based on file type
    if (['.jpg', '.jpeg', '.png'].includes(extension)) {
      // Check if ImageMagick is installed
      try {
        execSync('which convert', { stdio: 'ignore' });
        
        // Use ImageMagick to optimize
        execSync(`convert "${filePath}" -strip -quality 85 "${filePath}"`);
        console.log(`✅ Optimized image: ${filePath}`);
        return true;
      } catch (err) {
        // ImageMagick not installed, try another approach
        console.log('⚠️ ImageMagick not found. Using fallback optimization...');
        
        // For now, just copy the backup back as we couldn't optimize
        fs.copyFileSync(backupPath, filePath);
        return false;
      }
    } else if (extension === '.svg') {
      // For SVGs, we could use svgo but it requires npm installation
      // For simplicity, we'll just suggest manual optimization
      console.log(`⚠️ SVG optimization requires additional tools. Please optimize manually: ${filePath}`);
      return false;
    } else {
      console.log(`⚠️ Unsupported image format for optimization: ${extension}`);
      return false;
    }
  } catch (error) {
    console.error(`Error optimizing image ${filePath}:`, error.message);
    return false;
  }
}

// Run the cleanup process
async function runCleanup() {
  console.log(`Running in: ${currentDir}`);
  
  // Find large files
  const largeFiles = findLargeFiles(currentDir);
  
  if (largeFiles.length === 0) {
    console.log('✅ No large files found in the project!');
    rl.close();
    return;
  }
  
  console.log(`\nFound ${largeFiles.length} large files:`);
  console.log('------------------------------');
  
  // Group files by category
  const filesByCategory = {};
  let totalSize = 0;
  
  largeFiles.forEach((file, index) => {
    const category = getFileCategory(file.extension);
    if (!filesByCategory[category]) {
      filesByCategory[category] = [];
    }
    filesByCategory[category].push(file);
    totalSize += file.size;
    
    const isGitignored = isInGitignore(file.path);
    console.log(`${index + 1}. ${file.path}`);
    console.log(`   Size: ${formatFileSize(file.size)} | Type: ${category} | Git ignored: ${isGitignored ? 'Yes' : 'No'}`);
  });
  
  console.log('\n📊 Summary by category:');
  Object.keys(filesByCategory).forEach(category => {
    const files = filesByCategory[category];
    const categorySize = files.reduce((sum, file) => sum + file.size, 0);
    console.log(`${category}: ${files.length} files, ${formatFileSize(categorySize)}`);
  });
  
  console.log(`\nTotal size of large files: ${formatFileSize(totalSize)}`);
  
  // Ask what to do with the files
  console.log('\n🔧 Available actions:');
  console.log('1. Add large files to .gitignore');
  console.log('2. Optimize image files');
  console.log('3. Move large files to a separate directory');
  console.log('4. Delete specific large files');
  console.log('5. Exit without changes');
  
  const action = await new Promise(resolve => {
    rl.question('\nSelect an action (1-5): ', resolve);
  });
  
  switch (action) {
    case '1': // Add to .gitignore
      const gitignoreThreshold = await new Promise(resolve => {
        rl.question('Add files larger than how many MB to .gitignore? (default: 10): ', answer => {
          const threshold = parseInt(answer) || 10;
          resolve(threshold * 1024 * 1024);
        });
      });
      
      let gitignoreCount = 0;
      for (const file of largeFiles) {
        if (file.size >= gitignoreThreshold && !isInGitignore(file.path)) {
          if (addToGitignore(file.path)) {
            gitignoreCount++;
          }
        }
      }
      
      console.log(`✅ Added ${gitignoreCount} files to .gitignore`);
      break;
      
    case '2': // Optimize images
      const imageFiles = largeFiles.filter(file => IMAGE_EXTENSIONS.includes(file.extension));
      
      if (imageFiles.length === 0) {
        console.log('❌ No large image files found to optimize');
        break;
      }
      
      console.log(`Found ${imageFiles.length} large image files that could be optimized.`);
      const confirmOptimize = await new Promise(resolve => {
        rl.question('Do you want to optimize these images? (y/n): ', resolve);
      });
      
      if (confirmOptimize.toLowerCase() === 'y') {
        let optimizedCount = 0;
        for (const file of imageFiles) {
          console.log(`Optimizing: ${file.path}`);
          if (optimizeImage(file.path)) {
            optimizedCount++;
          }
        }
        
        console.log(`✅ Optimized ${optimizedCount} out of ${imageFiles.length} images`);
      }
      break;
      
    case '3': // Move to separate directory
      const moveDir = await new Promise(resolve => {
        rl.question('Enter directory name to move files to (default: large-files): ', answer => {
          resolve(answer || 'large-files');
        });
      });
      
      const moveDirPath = path.join(currentDir, moveDir);
      
      if (!fs.existsSync(moveDirPath)) {
        fs.mkdirSync(moveDirPath, { recursive: true });
      }
      
      const filesToMove = await new Promise(resolve => {
        rl.question('Enter file numbers to move (comma-separated, or "all"): ', answer => {
          if (answer.toLowerCase() === 'all') {
            resolve(largeFiles.map((_, i) => i + 1));
          } else {
            resolve(answer.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)));
          }
        });
      });
      
      let movedCount = 0;
      for (const fileNum of filesToMove) {
        if (fileNum > 0 && fileNum <= largeFiles.length) {
          const file = largeFiles[fileNum - 1];
          const fileName = path.basename(file.path);
          const destPath = path.join(moveDirPath, fileName);
          
          try {
            fs.copyFileSync(file.path, destPath);
            fs.unlinkSync(file.path);
            console.log(`✅ Moved: ${file.path} -> ${destPath}`);
            movedCount++;
          } catch (error) {
            console.error(`❌ Failed to move ${file.path}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Moved ${movedCount} files to ${moveDirPath}`);
      break;
      
    case '4': // Delete files
      const filesToDelete = await new Promise(resolve => {
        rl.question('Enter file numbers to delete (comma-separated): ', answer => {
          resolve(answer.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)));
        });
      });
      
      if (filesToDelete.length === 0) {
        console.log('No files selected for deletion');
        break;
      }
      
      const confirmDelete = await new Promise(resolve => {
        rl.question(`Are you sure you want to delete ${filesToDelete.length} files? This cannot be undone. (y/n): `, resolve);
      });
      
      if (confirmDelete.toLowerCase() !== 'y') {
        console.log('Deletion cancelled');
        break;
      }
      
      let deletedCount = 0;
      for (const fileNum of filesToDelete) {
        if (fileNum > 0 && fileNum <= largeFiles.length) {
          const file = largeFiles[fileNum - 1];
          
          try {
            fs.unlinkSync(file.path);
            console.log(`✅ Deleted: ${file.path}`);
            deletedCount++;
          } catch (error) {
            console.error(`❌ Failed to delete ${file.path}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Deleted ${deletedCount} files`);
      break;
      
    case '5': // Exit
      console.log('Exiting without changes');
      break;
      
    default:
      console.log('Invalid option selected');
  }
  
  console.log('\n✅ Cleanup process completed!');
  rl.close();
}

runCleanup(); 