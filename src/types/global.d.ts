/**
 * Global type declarations
 */

// Extend the Window interface to include the Q library
interface Window {
  Q: {
    (value: any): Promise<any>;
    defer: () => {
      promise: Promise<any>;
      resolve: (value?: any) => void;
      reject: (reason?: any) => void;
    };
    all: typeof Promise.all;
    reject: typeof Promise.reject;
    resolve: typeof Promise.resolve;
    when: (value: any, onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) => Promise<any>;
    fcall: (fn: Function, ...args: any[]) => Promise<any>;
    nfcall: (fn: Function, ...args: any[]) => Promise<any>;
  };
}

// Add any other global declarations here 