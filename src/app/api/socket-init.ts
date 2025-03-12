// Only import the server initialization in development mode
if (process.env.NODE_ENV !== 'production') {
  // Import the server initialization to make sure it's available
  require('@/lib/socket/server-init');
}

// This file is intentionally minimal
// Its purpose is to ensure the socket server is initialized
// when the app starts up, but only in development mode

export {}; 