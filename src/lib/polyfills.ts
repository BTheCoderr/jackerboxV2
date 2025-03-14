/**
 * Polyfills for legacy libraries
 * 
 * This file provides polyfills for older libraries that might be used by dependencies
 * but are no longer included in modern JavaScript environments.
 */

// Define the interface for the deferred object
interface Deferred {
  promise: Promise<any>;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

// Polyfill for the Q promise library
// Some older libraries might expect Q to be available globally
if (typeof window !== 'undefined') {
  console.log('Setting up Q promise library polyfill');
  
  // Simple implementation of the Q promise library using native Promises
  window.Q = function(value) {
    return Promise.resolve(value);
  };
  
  // Add common Q methods
  window.Q.defer = function(): Deferred {
    const deferred = {} as Deferred;
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  };
  
  window.Q.all = Promise.all.bind(Promise);
  window.Q.reject = Promise.reject.bind(Promise);
  window.Q.resolve = Promise.resolve.bind(Promise);
  
  window.Q.when = function(value, onFulfilled, onRejected) {
    return Promise.resolve(value).then(onFulfilled, onRejected);
  };

  // Make sure Q is fully initialized before any bundled code runs
  try {
    window.Q.fcall = function(fn, ...args) {
      try {
        return Promise.resolve(fn(...args));
      } catch (e) {
        return Promise.reject(e);
      }
    };

    window.Q.nfcall = function(fn, ...args) {
      return new Promise((resolve, reject) => {
        fn(...args, (err, ...result) => {
          if (err) reject(err);
          else resolve(result.length === 1 ? result[0] : result);
        });
      });
    };
    
    // Ensure Q is callable as a function and as an object
    const originalQ = window.Q;
    const newQ = Object.assign(
      function Q(value) { return originalQ(value); },
      originalQ
    );
    window.Q = newQ;
    
    console.log('Q polyfill initialized successfully');
  } catch (e) {
    console.error('Error initializing Q polyfill:', e);
  }
}

export {}; 