import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting static export deployment process...');

// Function to run a command and log output
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Check if the out directory exists and create it if not
if (!fs.existsSync('out')) {
  fs.mkdirSync('out');
}

// Build the static export
console.log('📦 Building static export...');
if (!runCommand('npm run build')) {
  console.error('❌ Build failed. Please check the errors above.');
  process.exit(1);
}

// Create a netlify.toml file for deployment
console.log('📝 Creating netlify.toml file...');
const netlifyConfig = `
[build]
  publish = "out"
  command = "echo 'Already built'"

# Handle client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

fs.writeFileSync('netlify.toml', netlifyConfig);

// Deploy to Netlify
console.log('🚀 Deploying to Netlify...');
if (runCommand('npx netlify deploy --prod --dir=out')) {
  console.log('✅ Deployment successful!');
} else {
  console.error('❌ Deployment failed. Please check the errors above.');
  process.exit(1);
}

console.log('🎉 Static export deployment completed!'); 