#!/usr/bin/env node

/**
 * This script helps identify and clean up potential secrets in the codebase
 * before pushing to GitHub or deploying to Vercel.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Directories to exclude from scanning
const excludeDirs = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
];

// File extensions to scan
const includeExtensions = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.yml',
  '.yaml',
  '.toml',
  '.env',
  '.md',
  '.html',
];

// Patterns that might indicate secrets
const secretPatterns = [
  /API_KEY\s*[:=]\s*["']([^"']+)["']/gi,
  /SECRET\s*[:=]\s*["']([^"']+)["']/gi,
  /PASSWORD\s*[:=]\s*["']([^"']+)["']/gi,
  /TOKEN\s*[:=]\s*["']([^"']+)["']/gi,
  /OAUTH\s*[:=]\s*["']([^"']+)["']/gi,
  /CLIENT_ID\s*[:=]\s*["']([^"']+)["']/gi,
  /CLIENT_SECRET\s*[:=]\s*["']([^"']+)["']/gi,
  /ACCESS_KEY\s*[:=]\s*["']([^"']+)["']/gi,
  /AUTH\s*[:=]\s*["']([^"']+)["']/gi,
];

// Files that might contain secrets
const potentialSecretFiles = [
  'vercel.json',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  'netlify.toml',
  'config.json',
  'credentials.json',
];

console.log('🔍 Scanning for potential secrets in the codebase...');

// Get all files in the project
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        fileList = getAllFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (includeExtensions.includes(ext) || potentialSecretFiles.includes(file)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Check a file for potential secrets
function checkFileForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let foundSecrets = false;
    let matches = [];
    
    secretPatterns.forEach(pattern => {
      const patternMatches = [...content.matchAll(pattern)];
      if (patternMatches.length > 0) {
        foundSecrets = true;
        matches = [...matches, ...patternMatches];
      }
    });
    
    if (foundSecrets) {
      console.log(`⚠️ Potential secrets found in: ${filePath}`);
      matches.forEach(match => {
        const line = content.substring(0, match.index).split('\n').length;
        console.log(`   - Line ${line}: ${match[0].substring(0, 50)}${match[0].length > 50 ? '...' : ''}`);
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  const rootDir = process.cwd();
  const allFiles = getAllFiles(rootDir);
  let secretsFound = false;
  
  console.log(`Scanning ${allFiles.length} files...`);
  
  allFiles.forEach(file => {
    if (checkFileForSecrets(file)) {
      secretsFound = true;
    }
  });
  
  if (secretsFound) {
    console.log('\n⚠️ Potential secrets were found in your codebase!');
    console.log('   Please review the files listed above and:');
    console.log('   1. Remove hardcoded secrets');
    console.log('   2. Use environment variables instead');
    console.log('   3. Add sensitive files to .gitignore');
    console.log('\n   Example of using environment variables:');
    console.log('   - Instead of: const apiKey = "abc123def456"');
    console.log('   - Use: const apiKey = process.env.API_KEY');
    console.log('\n   For Vercel deployment, set these as environment variables in the Vercel dashboard.');
  } else {
    console.log('\n✅ No potential secrets found in the scanned files.');
  }
  
  // Check for .env files that might not be in .gitignore
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('.env') && !gitignore.includes('*.env')) {
      console.log('\n⚠️ Warning: .env files are not excluded in .gitignore!');
      console.log('   Add the following to your .gitignore file:');
      console.log('   ```');
      console.log('   # environment variables');
      console.log('   .env');
      console.log('   .env.local');
      console.log('   .env.development.local');
      console.log('   .env.test.local');
      console.log('   .env.production.local');
      console.log('   ```');
    }
  }
}

main(); 