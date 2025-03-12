// Only import the server initialization in development mode
if (process.env.NODE_ENV !== 'production') {
  // Import the server initialization to make sure it's available
  // and handle the async initialization
  (async () => {
    try {
      // First, check if there's an existing socket server that needs to be shut down
      const { shutdownSocketServer, initServer, getSocketServerStatus } = await import('@/lib/socket/server-init');
      
      // Get the current status
      const status = getSocketServerStatus();
      
      // If there was an error in a previous initialization, shut down and try again
      if (status.error) {
        console.log('Previous socket server initialization had an error, shutting down and restarting...');
        shutdownSocketServer();
      }
      
      // Initialize the server
      await initServer();
      
      // Log the status after initialization
      const newStatus = getSocketServerStatus();
      console.log('Socket server status:', newStatus);
    } catch (error) {
      console.error('Failed to initialize socket server from API route:', error);
    }
  })();
}

// This file is intentionally minimal
// Its purpose is to ensure the socket server is initialized
// when the app starts up, but only in development mode

export {}; 