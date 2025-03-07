import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Sets up the complete beta testing environment
 */
async function main() {
  console.log('🚀 Setting up beta testing environment...');
  
  // Check if test mode is enabled
  const envLocalPath = path.join(process.cwd(), '.env.local');
  let testModeEnabled = false;
  
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    testModeEnabled = envContent.includes('NEXT_PUBLIC_TEST_MODE=true');
  }
  
  if (!testModeEnabled) {
    console.log('⚠️ Test mode is not enabled. Adding NEXT_PUBLIC_TEST_MODE=true to .env.local');
    
    // Create or update .env.local file
    const envLocalContent = fs.existsSync(envLocalPath) 
      ? fs.readFileSync(envLocalPath, 'utf8') 
      : '';
    
    if (envLocalContent.includes('NEXT_PUBLIC_TEST_MODE=')) {
      // Replace existing setting
      const updatedContent = envLocalContent.replace(
        /NEXT_PUBLIC_TEST_MODE=.*/,
        'NEXT_PUBLIC_TEST_MODE=true'
      );
      fs.writeFileSync(envLocalPath, updatedContent);
    } else {
      // Add new setting
      fs.writeFileSync(
        envLocalPath,
        `${envLocalContent}\n# Enable test mode for beta testing\nNEXT_PUBLIC_TEST_MODE=true\n`
      );
    }
    
    console.log('✅ Test mode enabled in .env.local');
  } else {
    console.log('✅ Test mode is already enabled');
  }
  
  // Step 1: Create beta test users
  console.log('\n📋 Step 1: Creating beta test users...');
  try {
    execSync('node scripts/create-beta-testers.js', { stdio: 'inherit' });
    console.log('✅ Beta test users created successfully');
  } catch (error) {
    console.error('❌ Error creating beta test users:', error.message);
    const continueSetup = await question('Do you want to continue with the setup? (y/n): ');
    if (continueSetup.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }
  
  // Step 2: Create sample equipment listings
  console.log('\n📋 Step 2: Creating sample equipment listings...');
  try {
    execSync('node scripts/create-test-equipment.js', { stdio: 'inherit' });
    console.log('✅ Sample equipment listings created successfully');
  } catch (error) {
    console.error('❌ Error creating sample equipment:', error.message);
    const continueSetup = await question('Do you want to continue with the setup? (y/n): ');
    if (continueSetup.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }
  
  // Step 3: Generate beta testing guide
  console.log('\n📋 Step 3: Checking beta testing guide...');
  const betaGuidePath = path.join(process.cwd(), 'BETA-TESTING-GUIDE.md');
  
  if (fs.existsSync(betaGuidePath)) {
    console.log('✅ Beta testing guide already exists');
    
    // Ask if user wants to open the guide
    const openGuide = await question('Do you want to open the beta testing guide? (y/n): ');
    if (openGuide.toLowerCase() === 'y') {
      try {
        // Try to open the guide with the default application
        if (process.platform === 'darwin') { // macOS
          execSync(`open "${betaGuidePath}"`);
        } else if (process.platform === 'win32') { // Windows
          execSync(`start "" "${betaGuidePath}"`);
        } else { // Linux
          execSync(`xdg-open "${betaGuidePath}"`);
        }
        console.log('✅ Opened beta testing guide');
      } catch (error) {
        console.error('❌ Error opening beta testing guide:', error.message);
        console.log(`📝 You can find the guide at: ${betaGuidePath}`);
      }
    }
  } else {
    console.error('❌ Beta testing guide not found. Please create BETA-TESTING-GUIDE.md');
  }
  
  // Step 4: Ask if user wants to start the development server
  console.log('\n📋 Step 4: Starting development server...');
  const startServer = await question('Do you want to start the development server now? (y/n): ');
  
  if (startServer.toLowerCase() === 'y') {
    console.log('🚀 Starting development server...');
    console.log('📝 Press Ctrl+C to stop the server when you\'re done');
    
    // Close readline interface before starting the server
    rl.close();
    
    try {
      execSync('npm run dev', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Error starting development server:', error.message);
      process.exit(1);
    }
  } else {
    console.log('\n🎉 Beta testing environment setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start the development server with: npm run dev');
    console.log('2. Share the beta testing guide with your testers');
    console.log('3. Collect feedback from your beta testers');
    
    rl.close();
  }
}

main().catch((error) => {
  console.error('❌ Error setting up beta testing environment:', error);
  process.exit(1);
}); 