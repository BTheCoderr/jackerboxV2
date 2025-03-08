import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Optimizing Jackerbox for mobile development...');

// Create mobile-specific configuration
const createMobileConfig = () => {
  console.log('Creating mobile configuration...');
  
  // Create next.config.mjs with mobile optimizations
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['res.cloudinary.com'],
    // Optimize images for mobile
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'],
  },
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: true,
    // Enable optimizations for mobile
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'date-fns', 'recharts'],
    // Reduce bundle size
    modularizeImports: {
      'react-icons': {
        transform: 'react-icons/{{member}}',
      },
    },
  },
  // Add PWA configuration
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    manifest: {
      name: 'Jackerbox',
      short_name: 'Jackerbox',
      description: 'Peer-to-Peer Equipment Rental',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#0f172a',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  }
};

export default nextConfig;`;

  fs.writeFileSync(path.join(process.cwd(), 'next.config.mobile.mjs'), nextConfig);
  console.log('✅ Created next.config.mobile.mjs');
};

// Create PWA manifest
const createPWAManifest = () => {
  console.log('Creating PWA manifest...');
  
  // Create icons directory if it doesn't exist
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Create manifest.json
  const manifest = {
    name: 'Jackerbox',
    short_name: 'Jackerbox',
    description: 'Peer-to-Peer Equipment Rental',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    start_url: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'public', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('✅ Created public/manifest.json');
};

// Create service worker
const createServiceWorker = () => {
  console.log('Creating service worker...');
  
  const serviceWorker = `// This is a simple service worker for PWA functionality
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

// Cache assets
const CACHE_NAME = 'jackerbox-cache-v1';
const urlsToCache = [
  '/',
  '/routes/equipment',
  '/routes/how-it-works',
  '/static/css/app.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});`;

  fs.writeFileSync(
    path.join(process.cwd(), 'public', 'sw.js'),
    serviceWorker
  );
  console.log('✅ Created public/sw.js');
};

// Create mobile-specific components
const createMobileComponents = () => {
  console.log('Creating mobile-specific components...');
  
  // Create mobile navigation component
  const mobileNavDir = path.join(process.cwd(), 'src', 'components', 'mobile');
  if (!fs.existsSync(mobileNavDir)) {
    fs.mkdirSync(mobileNavDir, { recursive: true });
  }
  
  const mobileNavbar = `'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNavbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path) => pathname === path;

  return (
    <div 
      className={\`fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 md:hidden z-50 transition-transform duration-300 \${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }\`}
    >
      <Link 
        href="/routes/equipment" 
        className={\`flex flex-col items-center p-2 \${isActive('/routes/equipment') ? 'text-blue-600' : 'text-gray-600'}\`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-xs">Browse</span>
      </Link>
      
      <Link 
        href="/routes/dashboard" 
        className={\`flex flex-col items-center p-2 \${isActive('/routes/dashboard') ? 'text-blue-600' : 'text-gray-600'}\`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-xs">Account</span>
      </Link>
      
      <Link 
        href="/routes/messages" 
        className={\`flex flex-col items-center p-2 \${isActive('/routes/messages') ? 'text-blue-600' : 'text-gray-600'}\`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="text-xs">Messages</span>
      </Link>
      
      <Link 
        href="/routes/equipment/new" 
        className={\`flex flex-col items-center p-2 \${isActive('/routes/equipment/new') ? 'text-blue-600' : 'text-gray-600'}\`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="text-xs">List Item</span>
      </Link>
    </div>
  );
}`;

  fs.writeFileSync(
    path.join(mobileNavDir, 'mobile-navbar.tsx'),
    mobileNavbar
  );
  console.log('✅ Created mobile navbar component');
  
  // Create mobile layout wrapper
  const mobileLayout = `'use client';

import { useEffect, useState } from 'react';
import { MobileNavbar } from './mobile-navbar';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    // Check if the app can be installed
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setIsInstallable(true);
    });
    
    // Handle app installed event
    window.addEventListener('appinstalled', () => {
      // Log app installed
      console.log('PWA was installed');
      // Hide install button
      setIsInstallable(false);
    });
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);
  
  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      setIsInstallable(false);
    });
  };
  
  return (
    <div className="pb-16 md:pb-0"> {/* Add padding to bottom for mobile navbar */}
      {children}
      
      {isInstallable && (
        <div className="fixed bottom-16 left-0 right-0 bg-blue-500 text-white p-3 text-center md:hidden z-40">
          <p className="text-sm">Install Jackerbox for a better experience</p>
          <button 
            onClick={handleInstallClick}
            className="mt-1 px-4 py-1 bg-white text-blue-500 rounded-full text-sm font-medium"
          >
            Install App
          </button>
        </div>
      )}
      
      <MobileNavbar />
    </div>
  );
}`;

  fs.writeFileSync(
    path.join(mobileNavDir, 'mobile-layout.tsx'),
    mobileLayout
  );
  console.log('✅ Created mobile layout component');
};

// Update layout to include mobile components
const updateLayout = () => {
  console.log('Updating layout for mobile...');
  
  const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
  if (fs.existsSync(layoutPath)) {
    let layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    // Check if we need to add mobile meta tags
    if (!layoutContent.includes('viewport')) {
      layoutContent = layoutContent.replace(
        '<head>',
        `<head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="theme-color" content="#0f172a" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />`
      );
    }
    
    // Add mobile layout if not already present
    if (!layoutContent.includes('MobileLayout')) {
      layoutContent = layoutContent.replace(
        'import { Analytics } from "@vercel/analytics/react";',
        `import { Analytics } from "@vercel/analytics/react";
import { MobileLayout } from "@/components/mobile/mobile-layout";`
      );
      
      // Wrap children with MobileLayout
      layoutContent = layoutContent.replace(
        '<body className',
        '<body className'
      );
      
      layoutContent = layoutContent.replace(
        '{children}',
        '<MobileLayout>{children}</MobileLayout>'
      );
    }
    
    fs.writeFileSync(layoutPath, layoutContent);
    console.log('✅ Updated layout.tsx for mobile');
  } else {
    console.log('⚠️ Could not find layout.tsx');
  }
};

// Create mobile optimization script
const createMobileOptimizationScript = () => {
  console.log('Creating mobile optimization script...');
  
  const script = `#!/bin/bash

# Switch to mobile configuration
echo "Switching to mobile-optimized configuration..."
cp next.config.mobile.mjs next.config.mjs

# Install required packages
echo "Installing PWA dependencies..."
npm install --save next-pwa

# Clean build cache
echo "Cleaning build cache..."
rm -rf .next

# Build the application
echo "Building mobile-optimized application..."
npm run build

# Start the application
echo "Starting mobile-optimized application..."
npm start
`;

  fs.writeFileSync(
    path.join(process.cwd(), 'scripts', 'start-mobile.sh'),
    script
  );
  fs.chmodSync(path.join(process.cwd(), 'scripts', 'start-mobile.sh'), '755');
  console.log('✅ Created start-mobile.sh script');
  
  // Add to package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts['mobile']) {
      packageJson.scripts['mobile'] = 'bash scripts/start-mobile.sh';
      packageJson.scripts['mobile:dev'] = 'cp next.config.mobile.mjs next.config.mjs && next dev';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added mobile scripts to package.json');
    }
  }
};

// Create placeholder icons
const createPlaceholderIcons = () => {
  console.log('Creating placeholder icons...');
  
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Create simple SVG icons (in real project, you'd use proper icons)
  const icon192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#0f172a"/>
  <text x="96" y="96" font-family="Arial" font-size="96" fill="white" text-anchor="middle" dominant-baseline="middle">J</text>
</svg>`;

  const icon512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f172a"/>
  <text x="256" y="256" font-family="Arial" font-size="256" fill="white" text-anchor="middle" dominant-baseline="middle">J</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), icon192);
  fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), icon512);
  
  console.log('✅ Created placeholder icons');
  console.log('⚠️ Note: For production, replace these with proper PNG icons');
};

// Run all functions
createMobileConfig();
createPWAManifest();
createServiceWorker();
createMobileComponents();
updateLayout();
createMobileOptimizationScript();
createPlaceholderIcons();

console.log('\n✅ Mobile optimization complete!');
console.log('\nTo start the mobile-optimized version:');
console.log('1. Run "npm run mobile:dev" for development');
console.log('2. Run "npm run mobile" for production');
console.log('\nTo test as a PWA:');
console.log('1. Build and start the app');
console.log('2. Open in Chrome and use DevTools > Application > Install');
console.log('3. Or access from a mobile device and use "Add to Home Screen"'); 