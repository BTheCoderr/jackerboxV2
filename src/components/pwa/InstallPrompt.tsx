"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // For non-iOS devices, listen for the beforeinstallprompt event
    if (!isIOSDevice) {
      const handleBeforeInstallPrompt = (e: Event) => {
        // Store the event so it can be triggered later
        // Don't prevent default here - this was causing the banner issue
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Show the install prompt banner
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } else {
      // For iOS, check if the app is already installed
      const isInStandaloneMode = 'standalone' in window.navigator && (window.navigator as any).standalone;
      if (!isInStandaloneMode) {
        // Show iOS-specific install instructions
        setShowPrompt(true);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt variable
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 p-4 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {isIOS ? 'Install Jackerbox on your iPhone' : 'Install Jackerbox App'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isIOS 
              ? 'Tap the share button and then "Add to Home Screen"' 
              : 'Install our app for a better experience'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isIOS && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleInstallClick}
              className="text-xs"
            >
              Install
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={dismissPrompt}
            className="text-xs"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
} 