import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🚀 Setting up Capacitor for Jackerbox...');

async function main() {
  try {
    // Step 1: Install Capacitor dependencies
    console.log('\n📦 Installing Capacitor dependencies...');
    execSync('npm install @capacitor/core @capacitor/cli', { stdio: 'inherit' });
    console.log('✅ Capacitor core dependencies installed');

    // Step 2: Get app information
    console.log('\n📝 Setting up app configuration...');
    const appId = await question('Enter app ID (e.g., com.jackerbox.app): ') || 'com.jackerbox.app';
    const appName = await question('Enter app name (default: Jackerbox): ') || 'Jackerbox';
    const webDir = 'out'; // Using Next.js static export directory

    // Step 3: Initialize Capacitor
    console.log('\n🔧 Initializing Capacitor...');
    execSync(`npx cap init "${appName}" "${appId}" --web-dir="${webDir}"`, { stdio: 'inherit' });
    console.log('✅ Capacitor initialized');

    // Step 4: Install platform-specific packages
    console.log('\n📱 Installing platform packages...');
    
    const installIos = await question('Install iOS platform? (y/n): ');
    if (installIos.toLowerCase() === 'y') {
      execSync('npm install @capacitor/ios', { stdio: 'inherit' });
      console.log('✅ iOS platform installed');
    }
    
    const installAndroid = await question('Install Android platform? (y/n): ');
    if (installAndroid.toLowerCase() === 'y') {
      execSync('npm install @capacitor/android', { stdio: 'inherit' });
      console.log('✅ Android platform installed');
    }

    // Step 5: Install essential Capacitor plugins
    console.log('\n🔌 Installing essential Capacitor plugins...');
    execSync('npm install @capacitor/camera @capacitor/geolocation @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar @capacitor/storage', { stdio: 'inherit' });
    console.log('✅ Essential plugins installed');

    // Step 6: Create a static export build script
    console.log('\n📝 Creating build script for Capacitor...');
    
    const buildScript = `#!/bin/bash
echo "🏗️ Building Jackerbox for Capacitor..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out

# Build Next.js for static export
echo "📦 Building Next.js static export..."
npm run build
npx next export

# Copy PWA assets to out directory
echo "📋 Copying PWA assets..."
cp public/manifest.json out/
cp public/sw.js out/
cp -r public/icons out/

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

echo "✅ Build complete! You can now open your native projects:"
echo "   - iOS: npx cap open ios"
echo "   - Android: npx cap open android"
`;

    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'build-for-capacitor.sh'), buildScript);
    execSync('chmod +x scripts/build-for-capacitor.sh', { stdio: 'inherit' });
    console.log('✅ Created build-for-capacitor.sh script');

    // Step 7: Update package.json with Capacitor scripts
    console.log('\n📝 Updating package.json with Capacitor scripts...');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      "build:capacitor": "bash scripts/build-for-capacitor.sh",
      "cap:sync": "npx cap sync",
      "cap:ios": "npx cap open ios",
      "cap:android": "npx cap open android",
      "cap:serve": "npx cap serve"
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with Capacitor scripts');

    // Step 8: Create Capacitor config
    console.log('\n📝 Creating Capacitor configuration...');
    
    const capacitorConfig = `{
  "appId": "${appId}",
  "appName": "${appName}",
  "webDir": "${webDir}",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 3000,
      "launchAutoHide": true,
      "backgroundColor": "#0f172a",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": true,
      "androidSpinnerStyle": "large",
      "iosSpinnerStyle": "small",
      "spinnerColor": "#ffffff",
      "splashFullScreen": true,
      "splashImmersive": true
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}`;
    
    fs.writeFileSync(path.join(process.cwd(), 'capacitor.config.json'), capacitorConfig);
    console.log('✅ Created capacitor.config.json');

    // Step 9: Create a README for Capacitor
    console.log('\n📝 Creating Capacitor README...');
    
    const readmeContent = `# Jackerbox Mobile App

This directory contains the Capacitor configuration for the Jackerbox mobile app.

## Getting Started

### Prerequisites

- Node.js and npm
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS development)

### Building the App

1. Build the web app and sync with Capacitor:
   \`\`\`
   npm run build:capacitor
   \`\`\`

2. Open the iOS project:
   \`\`\`
   npm run cap:ios
   \`\`\`

3. Open the Android project:
   \`\`\`
   npm run cap:android
   \`\`\`

### Development Workflow

1. Make changes to your web app
2. Build and sync with Capacitor:
   \`\`\`
   npm run build:capacitor
   \`\`\`
3. Test in native environment:
   \`\`\`
   npm run cap:ios
   # or
   npm run cap:android
   \`\`\`

### Live Reload During Development

For faster development, you can use the Capacitor development server:

\`\`\`
npm run cap:serve
\`\`\`

This will start a development server that allows you to see changes in real-time on your device or emulator.

## Customizing the App

### App Icon and Splash Screen

- iOS: Replace the icons in \`ios/App/App/Assets.xcassets/AppIcon.appiconset\`
- Android: Replace the icons in \`android/app/src/main/res/mipmap\`

### Native Code

You can add native code to enhance the app:

- iOS: Modify the Swift code in \`ios/App/App\`
- Android: Modify the Java code in \`android/app/src/main/java\`

## Plugins

The following Capacitor plugins are installed:

- Camera: For taking photos and accessing the photo library
- Geolocation: For accessing device location
- Push Notifications: For sending and receiving push notifications
- Splash Screen: For customizing the app's splash screen
- Status Bar: For controlling the device status bar
- Storage: For storing data locally on the device

To add more plugins, install them with npm and sync with Capacitor:

\`\`\`
npm install @capacitor/plugin-name
npx cap sync
\`\`\`

## Building for Production

### iOS

1. Open the iOS project:
   \`\`\`
   npm run cap:ios
   \`\`\`

2. In Xcode, select Product > Archive
3. Follow the prompts to upload to the App Store

### Android

1. Open the Android project:
   \`\`\`
   npm run cap:android
   \`\`\`

2. In Android Studio, select Build > Generate Signed Bundle / APK
3. Follow the prompts to create a signed APK or App Bundle
4. Upload to the Google Play Console
`;
    
    fs.writeFileSync(path.join(process.cwd(), 'CAPACITOR.md'), readmeContent);
    console.log('✅ Created CAPACITOR.md with instructions');

    // Step 10: Add platforms if selected
    if (installIos.toLowerCase() === 'y' || installAndroid.toLowerCase() === 'y') {
      console.log('\n🔧 Adding platforms to Capacitor...');
      
      // Create the out directory if it doesn't exist
      if (!fs.existsSync(path.join(process.cwd(), 'out'))) {
        fs.mkdirSync(path.join(process.cwd(), 'out'), { recursive: true });
        fs.writeFileSync(path.join(process.cwd(), 'out', 'index.html'), '<html><body>Placeholder</body></html>');
      }
      
      if (installIos.toLowerCase() === 'y') {
        console.log('Adding iOS platform...');
        execSync('npx cap add ios', { stdio: 'inherit' });
        console.log('✅ iOS platform added');
      }
      
      if (installAndroid.toLowerCase() === 'y') {
        console.log('Adding Android platform...');
        execSync('npx cap add android', { stdio: 'inherit' });
        console.log('✅ Android platform added');
      }
    }

    // Step 11: Create a Capacitor app component
    console.log('\n📝 Creating Capacitor app component...');
    
    const capacitorAppDir = path.join(process.cwd(), 'src', 'components', 'capacitor');
    if (!fs.existsSync(capacitorAppDir)) {
      fs.mkdirSync(capacitorAppDir, { recursive: true });
    }
    
    const capacitorAppComponent = `'use client';

import { useEffect, useState } from 'react';

// This component will only be loaded in the Capacitor environment
export function CapacitorApp({ children }: { children: React.ReactNode }) {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor
    const checkCapacitor = async () => {
      try {
        // Dynamic import to avoid issues with SSR
        const { Capacitor } = await import('@capacitor/core');
        const isCapacitorNative = Capacitor.isNativePlatform();
        setIsCapacitor(isCapacitorNative);
        
        if (isCapacitorNative) {
          // Initialize Capacitor plugins
          const { SplashScreen } = await import('@capacitor/splash-screen');
          const { StatusBar } = await import('@capacitor/status-bar');
          
          // Set status bar style
          StatusBar.setBackgroundColor({ color: '#0f172a' });
          StatusBar.setStyle({ style: 'LIGHT' });
          
          // Hide splash screen with fade
          setTimeout(() => {
            SplashScreen.hide({
              fadeOutDuration: 500
            });
          }, 1000);
        }
        
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing Capacitor:', error);
        setIsCapacitor(false);
        setIsReady(true);
      }
    };
    
    checkCapacitor();
  }, []);
  
  if (!isReady) {
    // Show loading state while checking
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If in Capacitor, add special styling and handling
  if (isCapacitor) {
    return (
      <div className="capacitor-app">
        {/* Add any Capacitor-specific UI adjustments here */}
        <style jsx global>{\`
          body {
            /* Prevent overscroll bounce effect on iOS */
            overscroll-behavior: none;
            /* Ensure full height */
            height: 100vh;
            /* Prevent text selection */
            -webkit-user-select: none;
            user-select: none;
            /* Prevent touch callouts */
            -webkit-touch-callout: none;
          }
          
          /* Fix for iOS safe areas */
          .capacitor-app {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
          
          /* Hide scrollbars but allow scrolling */
          ::-webkit-scrollbar {
            display: none;
          }
        \`}</style>
        {children}
      </div>
    );
  }
  
  // If not in Capacitor, just render children normally
  return <>{children}</>;
}`;
    
    fs.writeFileSync(path.join(capacitorAppDir, 'capacitor-app.tsx'), capacitorAppComponent);
    console.log('✅ Created Capacitor app component');

    // Step 12: Create a Capacitor camera component
    const capacitorCameraComponent = `'use client';

import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface CapacitorCameraProps {
  onImageCapture: (imageUrl: string) => void;
  buttonText?: string;
  className?: string;
}

export function CapacitorCamera({
  onImageCapture,
  buttonText = 'Take Photo',
  className = '',
}: CapacitorCameraProps) {
  const [loading, setLoading] = useState(false);

  const takePicture = async () => {
    try {
      setLoading(true);
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Select Image Source',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'From Photos',
        promptLabelPicture: 'Take Picture',
      });
      
      // The image URI is ready to use
      if (image.webPath) {
        onImageCapture(image.webPath);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={takePicture}
      disabled={loading}
      className={\`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 \${className}\`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        buttonText
      )}
    </button>
  );
}`;
    
    fs.writeFileSync(path.join(capacitorAppDir, 'capacitor-camera.tsx'), capacitorCameraComponent);
    console.log('✅ Created Capacitor camera component');

    // Step 13: Create a Capacitor geolocation component
    const capacitorGeolocationComponent = `'use client';

import { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';

interface CapacitorGeolocationProps {
  onLocationUpdate?: (position: Position) => void;
  watchPosition?: boolean;
  children?: React.ReactNode;
}

export function CapacitorGeolocation({
  onLocationUpdate,
  watchPosition = false,
  children,
}: CapacitorGeolocationProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let watchId: string | undefined;
    
    const getCurrentPosition = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        
        setPosition(position);
        if (onLocationUpdate) {
          onLocationUpdate(position);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setError('Could not get your location. Please check permissions.');
      } finally {
        setLoading(false);
      }
    };
    
    const startWatchingPosition = async () => {
      try {
        setLoading(true);
        setError(null);
        
        watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
          },
          (position) => {
            setPosition(position);
            if (onLocationUpdate) {
              onLocationUpdate(position);
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error watching location:', error);
        setError('Could not watch your location. Please check permissions.');
        setLoading(false);
      }
    };
    
    if (watchPosition) {
      startWatchingPosition();
    } else {
      getCurrentPosition();
    }
    
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchPosition, onLocationUpdate]);

  // If children are provided, render them with position as prop
  if (children) {
    return children;
  }
  
  // Otherwise render a default UI
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Location</h3>
      
      {loading && (
        <div className="flex items-center text-gray-500 mb-2">
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Getting location...
        </div>
      )}
      
      {error && (
        <div className="text-red-500 mb-2">{error}</div>
      )}
      
      {position && (
        <div className="text-gray-700">
          <p>Latitude: {position.coords.latitude.toFixed(6)}</p>
          <p>Longitude: {position.coords.longitude.toFixed(6)}</p>
          <p>Accuracy: ±{position.coords.accuracy.toFixed(1)}m</p>
          {position.coords.altitude !== null && (
            <p>Altitude: {position.coords.altitude.toFixed(1)}m</p>
          )}
        </div>
      )}
      
      <button
        onClick={() => watchPosition ? null : getCurrentPosition()}
        disabled={loading || watchPosition}
        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
      >
        Refresh Location
      </button>
    </div>
  );
}

// Helper function to get current position as a promise
export async function getCurrentPosition(): Promise<Position> {
  return Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
  });
}`;
    
    fs.writeFileSync(path.join(capacitorAppDir, 'capacitor-geolocation.tsx'), capacitorGeolocationComponent);
    console.log('✅ Created Capacitor geolocation component');

    // Step 14: Update the layout to conditionally use Capacitor
    console.log('\n📝 Updating layout to conditionally use Capacitor...');
    
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
    if (fs.existsSync(layoutPath)) {
      let layoutContent = fs.readFileSync(layoutPath, 'utf8');
      
      // Add Capacitor import if not already present
      if (!layoutContent.includes('CapacitorApp')) {
        layoutContent = layoutContent.replace(
          'import { MobileLayout } from "@/components/mobile/mobile-layout";',
          `import { MobileLayout } from "@/components/mobile/mobile-layout";
import dynamic from 'next/dynamic';

// Dynamically import Capacitor components to avoid SSR issues
const CapacitorApp = dynamic(
  () => import('@/components/capacitor/capacitor-app').then(mod => mod.CapacitorApp),
  { ssr: false }
);`
        );
        
        // Wrap children with CapacitorApp
        layoutContent = layoutContent.replace(
          '<MobileLayout>{children}</MobileLayout>',
          '<CapacitorApp><MobileLayout>{children}</MobileLayout></CapacitorApp>'
        );
      }
      
      fs.writeFileSync(layoutPath, layoutContent);
      console.log('✅ Updated layout.tsx for Capacitor');
    } else {
      console.log('⚠️ Could not find layout.tsx');
    }

    console.log('\n🎉 Capacitor setup complete!');
    console.log('\nNext steps:');
    console.log('1. Build your app for Capacitor: npm run build:capacitor');
    console.log('2. Open iOS project: npm run cap:ios');
    console.log('3. Open Android project: npm run cap:android');
    console.log('\nSee CAPACITOR.md for more details on customizing and building your mobile app.');
  } catch (error) {
    console.error('❌ Error setting up Capacitor:', error);
  } finally {
    rl.close();
  }
}

main(); 