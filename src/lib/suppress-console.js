// This script suppresses unwanted console messages in the browser
// Particularly useful for development to reduce noise from hot-reloading

if (typeof window !== 'undefined') {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Messages to filter out (partial matches)
  const filteredMessages = [
    'hot-reloader-client.js',
    '[Fast Refresh]',
    'main-app.js',
    'Vercel Web Analytics',
    'Debug mode is enabled',
    'pageview',
    'script.debug.js',
    'hot-reloader-client.js:242',
    'hot-reloader-client.js:74'
  ];

  // Override console.error
  console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string') {
      const message = args[0];
      // Check if the message contains any of the filtered strings
      if (filteredMessages.some(filter => message.includes(filter))) {
        return; // Suppress the message
      }
    }
    originalConsoleError(...args);
  };

  // Override console.warn
  console.warn = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string') {
      const message = args[0];
      // Check if the message contains any of the filtered strings
      if (filteredMessages.some(filter => message.includes(filter))) {
        return; // Suppress the message
      }
    }
    originalConsoleWarn(...args);
  };

  // Override console.log for specific patterns
  console.log = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string') {
      const message = args[0];
      // Check if the message contains any of the filtered strings
      if (filteredMessages.some(filter => message.includes(filter))) {
        return; // Suppress the message
      }
    }
    originalConsoleLog(...args);
  };
}

export {}; 