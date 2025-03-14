// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Check for updates to the Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Service Worker update found!');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              if (window.confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
      
    // Handle service worker updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
    
    // Setup background sync if available
    if ('SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        // Register sync for messages
        document.addEventListener('message-sync-required', () => {
          registration.sync.register('sync-messages')
            .catch(err => console.error('Background sync registration failed:', err));
        });
        
        // Register sync for bookings
        document.addEventListener('booking-sync-required', () => {
          registration.sync.register('sync-bookings')
            .catch(err => console.error('Background sync registration failed:', err));
        });
      });
    }
  });
} 