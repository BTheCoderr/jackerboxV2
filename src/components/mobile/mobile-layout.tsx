'use client';

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
}