#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔒 JACKERBOX SECURITY AUDIT - PRE-LAUNCH CHECK');
console.log('=============================================\n');

// 🚨 CRITICAL SECURITY ISSUES FOUND:

const securityIssues = [];

// Check for exposed API keys in ENV-EXAMPLE.md
const envExamplePath = path.join(__dirname, '../ENV-EXAMPLE.md');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  if (envContent.includes('646841252992477') || envContent.includes('Zxu873QWGlD6cYq2gB9cqFO6wG0')) {
    securityIssues.push({
      level: 'CRITICAL',
      issue: 'Real Cloudinary API credentials exposed in ENV-EXAMPLE.md',
      file: 'ENV-EXAMPLE.md',
      fix: 'Replace with placeholder values like "your-cloudinary-api-key"'
    });
  }
  
  if (envContent.includes('AVL4AAIj') || envContent.includes('upstash.io')) {
    securityIssues.push({
      level: 'CRITICAL', 
      issue: 'Real Redis/Upstash credentials exposed in ENV-EXAMPLE.md',
      file: 'ENV-EXAMPLE.md',
      fix: 'Replace with placeholder values like "your-redis-url"'
    });
  }
}

// Check for console.log statements with sensitive data
const scriptsToCheck = [
  'scripts/test-cloudinary-direct.js',
  'scripts/auth-debug.js',
  'scripts/test-apple-config.js'
];

scriptsToCheck.forEach(scriptPath => {
  const fullPath = path.join(__dirname, '../', scriptPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes('console.log') && content.includes('646841252992477')) {
      securityIssues.push({
        level: 'HIGH',
        issue: 'Hardcoded API key in console.log statement',
        file: scriptPath,
        fix: 'Remove or mask API keys in logging'
      });
    }
  }
});

// Check for exposed secrets in production API endpoints
const apiFiles = [
  'src/app/api/auth/test-apple/route.ts'
];

apiFiles.forEach(apiPath => {
  const fullPath = path.join(__dirname, '../', apiPath);
  if (fs.existsSync(fullPath)) {
    securityIssues.push({
      level: 'HIGH',
      issue: 'Debug API endpoint exposes environment variables',
      file: apiPath,
      fix: 'Remove or secure debug endpoints before production'
    });
  }
});

// Display results
if (securityIssues.length === 0) {
  console.log('✅ No critical security issues found!');
} else {
  console.log(`🚨 Found ${securityIssues.length} security issues:\n`);
  
  securityIssues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.level}] ${issue.issue}`);
    console.log(`   File: ${issue.file}`);
    console.log(`   Fix: ${issue.fix}\n`);
  });
  
  console.log('🔧 RECOMMENDED ACTIONS BEFORE PRODUCT HUNT:');
  console.log('1. Replace all real API keys in ENV-EXAMPLE.md with placeholders');
  console.log('2. Remove or secure debug API endpoints');
  console.log('3. Remove console.log statements with sensitive data');
  console.log('4. Ensure .env files are in .gitignore');
  console.log('5. Use environment variables for all secrets in production\n');
}

// Check environment variable security
console.log('📋 PRODUCTION DEPLOYMENT CHECKLIST:');
console.log('□ All real API keys removed from example files');
console.log('□ Debug endpoints removed or secured');
console.log('□ Console.error/log statements cleaned up');
console.log('□ Environment variables properly set in production');
console.log('□ Database credentials secured');
console.log('□ Webhook endpoints use proper signature verification');
console.log('□ CORS properly configured');
console.log('□ Rate limiting implemented on sensitive endpoints');
console.log('□ Input validation on all API endpoints');
console.log('□ Error messages don\'t expose sensitive information\n');

process.exit(securityIssues.length > 0 ? 1 : 0); 