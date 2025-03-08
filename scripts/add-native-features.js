import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Adding native features to Jackerbox...');

async function main() {
  try {
    // Step 1: Create directory for native feature components
    console.log('\n📁 Creating directories for native features...');
    const nativeFeaturesDir = path.join(process.cwd(), 'src', 'components', 'native-features');
    if (!fs.existsSync(nativeFeaturesDir)) {
      fs.mkdirSync(nativeFeaturesDir, { recursive: true });
    }
    console.log('✅ Created native features directory');

    // Step 2: Create a file picker component using Capacitor
    console.log('\n📝 Creating file picker component...');
    const filePickerComponent = `'use client';

import { useState } from 'react';
import { FilePicker, FilePickerResult } from '@capawesome/capacitor-file-picker';

interface NativeFilePickerProps {
  onFileSelect: (files: FilePickerResult) => void;
  buttonText?: string;
  multiple?: boolean;
  accept?: string[];
  className?: string;
}

export function NativeFilePicker({
  onFileSelect,
  buttonText = 'Select Files',
  multiple = false,
  accept = ['image/*', 'application/pdf'],
  className = '',
}: NativeFilePickerProps) {
  const [loading, setLoading] = useState(false);

  const pickFiles = async () => {
    try {
      setLoading(true);
      
      const result = await FilePicker.pickFiles({
        multiple,
        readData: true,
        types: accept,
      });
      
      onFileSelect(result);
    } catch (error) {
      console.error('Error picking files:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={pickFiles}
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
    
    fs.writeFileSync(path.join(nativeFeaturesDir, 'native-file-picker.tsx'), filePickerComponent);
    console.log('✅ Created native file picker component');

    // Step 3: Create a barcode scanner component
    console.log('\n📝 Creating barcode scanner component...');
    const barcodeScannerComponent = `'use client';

import { useState } from 'react';
import { BarcodeScanner, ScanResult } from '@capacitor-community/barcode-scanner';

interface NativeBarcodeScannerProps {
  onScan: (result: ScanResult) => void;
  buttonText?: string;
  className?: string;
}

export function NativeBarcodeScanner({
  onScan,
  buttonText = 'Scan Barcode',
  className = '',
}: NativeBarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);

  const startScan = async () => {
    try {
      // Check camera permission
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        // Make background transparent
        document.querySelector('body')?.classList.add('scanner-active');
        
        // Start scanning
        setScanning(true);
        BarcodeScanner.hideBackground();
        
        const result = await BarcodeScanner.startScan();
        
        // If the result has content
        if (result.hasContent) {
          onScan(result);
        }
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
    } finally {
      // Clean up
      document.querySelector('body')?.classList.remove('scanner-active');
      setScanning(false);
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
    }
  };

  // Stop scanning when component unmounts
  const stopScan = () => {
    document.querySelector('body')?.classList.remove('scanner-active');
    BarcodeScanner.showBackground();
    BarcodeScanner.stopScan();
    setScanning(false);
  };

  return (
    <>
      {scanning ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
          <div className="scanner-view" style={{ width: '250px', height: '250px', border: '2px solid white', borderRadius: '10px' }}></div>
          <button
            onClick={stopScan}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={startScan}
          className={\`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 \${className}\`}
        >
          {buttonText}
        </button>
      )}
      
      <style jsx global>{\`
        .scanner-active {
          background: transparent !important;
          visibility: visible !important;
        }
        
        .scanner-active * {
          visibility: hidden;
        }
        
        .scanner-active .scanner-view, 
        .scanner-active .scanner-view * {
          visibility: visible;
        }
      \`}</style>
    </>
  );
}`;
    
    fs.writeFileSync(path.join(nativeFeaturesDir, 'native-barcode-scanner.tsx'), barcodeScannerComponent);
    console.log('✅ Created native barcode scanner component');

    // Step 4: Create a device info component
    console.log('\n📝 Creating device info component...');
    const deviceInfoComponent = `'use client';

import { useEffect, useState } from 'react';
import { Device, DeviceInfo, BatteryInfo, GetLanguageCodeResult } from '@capacitor/device';

export function NativeDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);
  const [languageCode, setLanguageCode] = useState<GetLanguageCodeResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        setLoading(true);
        
        const info = await Device.getInfo();
        const battery = await Device.getBatteryInfo();
        const language = await Device.getLanguageCode();
        
        setDeviceInfo(info);
        setBatteryInfo(battery);
        setLanguageCode(language);
      } catch (error) {
        console.error('Error getting device info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getDeviceInfo();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-center text-gray-500">
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading device info...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Device Information</h3>
      
      {deviceInfo && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">Model:</div>
            <div className="font-medium">{deviceInfo.model}</div>
            
            <div className="text-gray-500">Platform:</div>
            <div className="font-medium">{deviceInfo.platform}</div>
            
            <div className="text-gray-500">OS:</div>
            <div className="font-medium">{deviceInfo.operatingSystem}</div>
            
            <div className="text-gray-500">OS Version:</div>
            <div className="font-medium">{deviceInfo.osVersion}</div>
            
            <div className="text-gray-500">Manufacturer:</div>
            <div className="font-medium">{deviceInfo.manufacturer}</div>
            
            <div className="text-gray-500">Web View:</div>
            <div className="font-medium">{deviceInfo.webViewVersion}</div>
            
            <div className="text-gray-500">Virtual:</div>
            <div className="font-medium">{deviceInfo.isVirtual ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
      
      {batteryInfo && (
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Battery</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">Level:</div>
            <div className="font-medium">{Math.round(batteryInfo.batteryLevel * 100)}%</div>
            
            <div className="text-gray-500">Charging:</div>
            <div className="font-medium">{batteryInfo.isCharging ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
      
      {languageCode && (
        <div>
          <h4 className="text-md font-medium mb-2">Language</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">Code:</div>
            <div className="font-medium">{languageCode.value}</div>
          </div>
        </div>
      )}
    </div>
  );
}`;
    
    fs.writeFileSync(path.join(nativeFeaturesDir, 'native-device-info.tsx'), deviceInfoComponent);
    console.log('✅ Created native device info component');

    // Step 5: Create a local notifications component
    console.log('\n📝 Creating local notifications component...');
    const localNotificationsComponent = `'use client';

import { useState } from 'react';
import { LocalNotifications, ScheduleOptions, PendingLocalNotificationSchema } from '@capacitor/local-notifications';

interface NativeNotificationProps {
  title?: string;
  body?: string;
  buttonText?: string;
  className?: string;
}

export function NativeNotification({
  title = 'Jackerbox Notification',
  body = 'This is a test notification from Jackerbox',
  buttonText = 'Send Notification',
  className = '',
}: NativeNotificationProps) {
  const [loading, setLoading] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<PendingLocalNotificationSchema[]>([]);

  const sendNotification = async () => {
    try {
      setLoading(true);
      
      // Request permission first
      const permissionStatus = await LocalNotifications.requestPermissions();
      
      if (permissionStatus.display === 'granted') {
        // Schedule the notification
        const notificationOptions: ScheduleOptions = {
          notifications: [
            {
              id: new Date().getTime(),
              title,
              body,
              schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
              sound: 'beep.wav',
              attachments: null,
              actionTypeId: '',
              extra: null,
            },
          ],
        };
        
        await LocalNotifications.schedule(notificationOptions);
        
        // Get pending notifications
        const pending = await LocalNotifications.getPending();
        setPendingNotifications(pending.notifications);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await LocalNotifications.cancelAll();
      setPendingNotifications([]);
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Local Notifications</h3>
      
      <div className="flex flex-col space-y-4">
        <button
          onClick={sendNotification}
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
        
        {pendingNotifications.length > 0 && (
          <>
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2">Pending Notifications ({pendingNotifications.length})</h4>
              <ul className="list-disc pl-5">
                {pendingNotifications.map((notification) => (
                  <li key={notification.id} className="mb-2">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-gray-500">{notification.body}</div>
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={cancelAllNotifications}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Cancel All Notifications
            </button>
          </>
        )}
      </div>
    </div>
  );
}`;
    
    fs.writeFileSync(path.join(nativeFeaturesDir, 'native-notification.tsx'), localNotificationsComponent);
    console.log('✅ Created native notifications component');

    // Step 6: Create a native features demo page
    console.log('\n📝 Creating native features demo page...');
    const nativeFeaturesPageDir = path.join(process.cwd(), 'src', 'app', 'routes', 'native-features');
    if (!fs.existsSync(nativeFeaturesPageDir)) {
      fs.mkdirSync(nativeFeaturesPageDir, { recursive: true });
    }
    
    const nativeFeaturesPage = `'use client';

import { useState } from 'react';
import { NativeDeviceInfo } from '@/components/native-features/native-device-info';
import { NativeNotification } from '@/components/native-features/native-notification';
import dynamic from 'next/dynamic';

// Dynamically import components that use Capacitor plugins
// to avoid SSR issues
const NativeCamera = dynamic(
  () => import('@/components/capacitor/capacitor-camera').then(mod => mod.CapacitorCamera),
  { ssr: false }
);

const NativeGeolocation = dynamic(
  () => import('@/components/capacitor/capacitor-geolocation').then(mod => mod.CapacitorGeolocation),
  { ssr: false }
);

const NativeFilePicker = dynamic(
  () => import('@/components/native-features/native-file-picker').then(mod => mod.NativeFilePicker),
  { ssr: false }
);

const NativeBarcodeScanner = dynamic(
  () => import('@/components/native-features/native-barcode-scanner').then(mod => mod.NativeBarcodeScanner),
  { ssr: false }
);

export default function NativeFeaturesPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  const handleImageCapture = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleBarcodeScan = (result: any) => {
    setScanResult(result.content);
  };

  const handleFileSelect = (result: any) => {
    if (result.files && result.files.length > 0) {
      setSelectedFiles(result.files);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Native Features Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Camera</h2>
          <div className="flex flex-col items-center">
            <NativeCamera onImageCapture={handleImageCapture} buttonText="Take Photo" />
            
            {selectedImage && (
              <div className="mt-4">
                <img 
                  src={selectedImage} 
                  alt="Captured" 
                  className="w-full max-w-xs rounded-lg shadow-sm" 
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Geolocation Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Geolocation</h2>
          <NativeGeolocation />
        </div>
        
        {/* File Picker Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">File Picker</h2>
          <div className="flex flex-col">
            <NativeFilePicker 
              onFileSelect={handleFileSelect} 
              buttonText="Select Files" 
              multiple={true} 
            />
            
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Selected Files:</h3>
                <ul className="list-disc pl-5">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="mb-1">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Barcode Scanner Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Barcode Scanner</h2>
          <div className="flex flex-col items-center">
            <NativeBarcodeScanner onScan={handleBarcodeScan} buttonText="Scan Barcode" />
            
            {scanResult && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg w-full">
                <h3 className="font-medium mb-1">Scan Result:</h3>
                <p className="break-all">{scanResult}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Device Info Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Device Info</h2>
          <NativeDeviceInfo />
        </div>
        
        {/* Notifications Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <NativeNotification />
        </div>
      </div>
    </div>
  );
}`;
    
    fs.writeFileSync(path.join(nativeFeaturesPageDir, 'page.tsx'), nativeFeaturesPage);
    console.log('✅ Created native features demo page');

    // Step 7: Install required Capacitor plugins
    console.log('\n📦 Installing additional Capacitor plugins...');
    
    const pluginsToInstall = [
      '@capawesome/capacitor-file-picker',
      '@capacitor/local-notifications',
      '@capacitor-community/barcode-scanner'
    ];
    
    const installCommand = `npm install ${pluginsToInstall.join(' ')}`;
    console.log(`Running: ${installCommand}`);
    
    try {
      execSync(installCommand, { stdio: 'inherit' });
      console.log('✅ Installed additional Capacitor plugins');
    } catch (error) {
      console.error('⚠️ Error installing plugins:', error);
      console.log('You may need to install these plugins manually:');
      pluginsToInstall.forEach(plugin => console.log(`  - ${plugin}`));
    }

    // Step 8: Update navigation to include native features page
    console.log('\n📝 Updating navigation to include native features page...');
    
    const navbarPath = path.join(process.cwd(), 'src', 'components', 'layout', 'navbar.tsx');
    if (fs.existsSync(navbarPath)) {
      let navbarContent = fs.readFileSync(navbarPath, 'utf8');
      
      // Check if the native features link already exists
      if (!navbarContent.includes('native-features')) {
        // Find the navigation links array
        const navLinksRegex = /const\s+navLinks\s*=\s*\[([\s\S]*?)\];/;
        const navLinksMatch = navbarContent.match(navLinksRegex);
        
        if (navLinksMatch) {
          // Add the native features link to the navigation
          const newNavLink = `  { name: "Native Features", href: "/routes/native-features" },\n`;
          const updatedNavLinks = navLinksMatch[0].replace(
            /\];/,
            `${newNavLink}];`
          );
          
          navbarContent = navbarContent.replace(navLinksRegex, updatedNavLinks);
          fs.writeFileSync(navbarPath, navbarContent);
          console.log('✅ Updated navigation to include native features page');
        } else {
          console.log('⚠️ Could not find navigation links in navbar.tsx');
        }
      } else {
        console.log('✅ Native features link already exists in navigation');
      }
    } else {
      console.log('⚠️ Could not find navbar.tsx');
    }

    // Step 9: Create a README for native features
    console.log('\n📝 Creating README for native features...');
    
    const nativeFeaturesReadme = `# Native Features in Jackerbox

This directory contains components that leverage Capacitor plugins to access native device features.

## Available Components

### Camera
- Component: \`CapacitorCamera\`
- Location: \`src/components/capacitor/capacitor-camera.tsx\`
- Features: Take photos, access photo library

### Geolocation
- Component: \`CapacitorGeolocation\`
- Location: \`src/components/capacitor/capacitor-geolocation.tsx\`
- Features: Get current location, watch location changes

### File Picker
- Component: \`NativeFilePicker\`
- Location: \`src/components/native-features/native-file-picker.tsx\`
- Features: Select files from device storage

### Barcode Scanner
- Component: \`NativeBarcodeScanner\`
- Location: \`src/components/native-features/native-barcode-scanner.tsx\`
- Features: Scan QR codes and barcodes

### Device Info
- Component: \`NativeDeviceInfo\`
- Location: \`src/components/native-features/native-device-info.tsx\`
- Features: Display device information, battery status, language

### Local Notifications
- Component: \`NativeNotification\`
- Location: \`src/components/native-features/native-notification.tsx\`
- Features: Send and manage local notifications

## Usage

These components are designed to work in a Capacitor environment. They will gracefully handle errors when running in a web-only environment.

Example usage:

\`\`\`tsx
import { NativeCamera } from '@/components/capacitor/capacitor-camera';

export default function MyComponent() {
  const handleImageCapture = (imageUrl: string) => {
    console.log('Image captured:', imageUrl);
  };

  return (
    <NativeCamera 
      onImageCapture={handleImageCapture} 
      buttonText="Take Photo" 
    />
  );
}
\`\`\`

## Demo Page

A demo page showcasing all native features is available at:
\`/routes/native-features\`

## Adding New Native Features

To add a new native feature:

1. Install the required Capacitor plugin:
   \`\`\`
   npm install @capacitor/plugin-name
   \`\`\`

2. Create a new component in the appropriate directory
3. Import and use the plugin in your component
4. Add the component to the demo page

## Testing Native Features

To test these features:

1. Build your app for Capacitor:
   \`\`\`
   npm run build:capacitor
   \`\`\`

2. Open the iOS or Android project:
   \`\`\`
   npm run cap:ios
   # or
   npm run cap:android
   \`\`\`

3. Run the app on a device or emulator
`;
    
    fs.writeFileSync(path.join(process.cwd(), 'src', 'components', 'native-features', 'README.md'), nativeFeaturesReadme);
    console.log('✅ Created README for native features');

    console.log('\n🎉 Native features setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run the Capacitor setup script: node scripts/setup-capacitor.js');
    console.log('2. Build your app for Capacitor: npm run build:capacitor');
    console.log('3. Test the native features on a device or emulator');
    console.log('\nVisit /routes/native-features in your app to see the demo page.');
  } catch (error) {
    console.error('❌ Error setting up native features:', error);
  }
}

main(); 