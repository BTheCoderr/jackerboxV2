// Mock webpack.js
// This file serves as a fallback when the real webpack.js is not found
// It provides empty implementations of webpack functions to prevent errors

(function() {
  console.log('[Mock Webpack] Loaded fallback webpack.js');
  
  // Define basic webpack globals to prevent errors
  window.__webpack_require__ = function() {
    return {};
  };
  
  window.__webpack_chunk_load__ = function() {
    return Promise.resolve();
  };
  
  window.__webpack_modules__ = {};
  window.__webpack_public_path__ = '/';
  
  // HMR-related functions
  window.__webpack_hash__ = '';
  window.__webpack_require__.h = function() {
    return window.__webpack_hash__;
  };
  
  // Module cache
  window.__webpack_require__.c = {};
  
  // Define getter function for harmony exports
  window.__webpack_require__.d = function(exports, definition) {
    for (var key in definition) {
      if (Object.prototype.hasOwnProperty.call(definition, key) && !Object.prototype.hasOwnProperty.call(exports, key)) {
        Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
      }
    }
  };
  
  // Define __esModule on exports
  window.__webpack_require__.r = function(exports) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    }
    Object.defineProperty(exports, '__esModule', { value: true });
  };
  
  // Create a fake namespace object
  window.__webpack_require__.t = function(value, mode) {
    return value;
  };
  
  // Empty hot module replacement API
  window.__webpack_require__.hmrF = function() { return Promise.resolve(); };
  window.__webpack_require__.hmrM = function() { return Promise.resolve({}); };
  
  // Mock Next.js HMR
  window.__next_require__ = window.__webpack_require__;
  window.__next_chunk_load__ = window.__webpack_chunk_load__;
})(); 