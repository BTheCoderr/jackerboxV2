import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🚀 Starting Vercel deployment process...');
  
  // Check if vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI is already installed');
  } catch (error) {
    console.log('📦 Installing Vercel CLI...');
    try {
      execSync('npm install -g vercel', { stdio: 'inherit' });
    } catch (installError) {
      console.error('❌ Error installing Vercel CLI:', installError.message);
      process.exit(1);
    }
  }
  
  // Check for Vercel-specific dependencies
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    let needsUpdate = false;
    
    // Check if @vercel/analytics is installed
    if (!packageJson.dependencies['@vercel/analytics']) {
      console.log('📦 Installing @vercel/analytics...');
      execSync('npm install @vercel/analytics', { stdio: 'inherit' });
      needsUpdate = true;
    }
    
    // Check if @vercel/speed-insights is installed
    if (!packageJson.dependencies['@vercel/speed-insights']) {
      console.log('📦 Installing @vercel/speed-insights...');
      execSync('npm install @vercel/speed-insights', { stdio: 'inherit' });
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      console.log('✅ Vercel dependencies installed');
    } else {
      console.log('✅ Vercel dependencies already installed');
    }
  } catch (error) {
    console.error('❌ Error checking/installing dependencies:', error.message);
  }
  
  // Update layout.tsx to include Vercel analytics
  try {
    const layoutPath = 'src/app/layout.tsx';
    let layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    // Check if Analytics and SpeedInsights are already imported
    const hasAnalytics = layoutContent.includes('@vercel/analytics/react');
    const hasSpeedInsights = layoutContent.includes('@vercel/speed-insights/next');
    
    if (!hasAnalytics || !hasSpeedInsights) {
      console.log('🔄 Updating layout.tsx to include Vercel analytics...');
      
      // Add imports if needed
      if (!hasAnalytics && !hasSpeedInsights) {
        layoutContent = layoutContent.replace(
          'import "./globals.css";',
          'import "./globals.css";\nimport { Analytics } from "@vercel/analytics/react";\nimport { SpeedInsights } from "@vercel/speed-insights/next";'
        );
      } else if (!hasAnalytics) {
        layoutContent = layoutContent.replace(
          'import "./globals.css";',
          'import "./globals.css";\nimport { Analytics } from "@vercel/analytics/react";'
        );
      } else if (!hasSpeedInsights) {
        layoutContent = layoutContent.replace(
          'import "./globals.css";',
          'import "./globals.css";\nimport { SpeedInsights } from "@vercel/speed-insights/next";'
        );
      }
      
      // Add components if needed
      if (!layoutContent.includes('<Analytics />') && !layoutContent.includes('<SpeedInsights />')) {
        layoutContent = layoutContent.replace(
          '</body>',
          '        <Analytics />\n        <SpeedInsights />\n      </body>'
        );
      } else if (!layoutContent.includes('<Analytics />')) {
        layoutContent = layoutContent.replace(
          '</body>',
          '        <Analytics />\n      </body>'
        );
      } else if (!layoutContent.includes('<SpeedInsights />')) {
        layoutContent = layoutContent.replace(
          '</body>',
          '        <SpeedInsights />\n      </body>'
        );
      }
      
      fs.writeFileSync(layoutPath, layoutContent);
      console.log('✅ layout.tsx updated successfully');
    } else {
      console.log('✅ layout.tsx already includes Vercel analytics');
    }
  } catch (error) {
    console.error('❌ Error updating layout.tsx:', error.message);
  }
  
  // Build the application
  console.log('📦 Building the application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    const retry = await question('Would you like to continue with deployment anyway? (y/n): ');
    if (retry.toLowerCase() !== 'y') {
      console.log('❌ Deployment cancelled.');
      rl.close();
      return;
    }
  }
  
  // Deploy to Vercel
  console.log('🚀 Deploying to Vercel...');
  try {
    // Ask if user wants to use environment variables from .env
    const useEnv = await question('Would you like to use environment variables from .env file? (y/n): ');
    
    if (useEnv.toLowerCase() === 'y' && fs.existsSync('.env')) {
      console.log('📝 Using environment variables from .env file...');
      execSync('vercel --env-file .env --prod', { stdio: 'inherit' });
    } else {
      console.log('📝 Proceeding without .env file...');
      execSync('vercel --prod', { stdio: 'inherit' });
    }
    
    console.log('✅ Deployment successful!');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('🔍 Check the error message above for details.');
  }
  
  console.log('🎉 Vercel deployment process completed!');
  console.log('📝 Note: Your API routes should now be functional.');
  console.log('📝 You can access your site at the URL provided by Vercel above.');
  console.log('📝 You can manage your site settings in the Vercel dashboard.');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 