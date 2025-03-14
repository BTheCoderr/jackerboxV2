/**
 * Preload script for Jackerbox
 * This script preloads critical resources to improve performance
 */

// Function to preload resources
function preloadResources() {
  // Preload critical CSS
  preloadCSS('/styles/main.css');
  
  // Preload critical fonts
  preloadFont('/fonts/inter-var.woff2', 'woff2');
  
  // Preload critical images
  preloadImage('/icons/icon-192x192.png');
  
  // Preload critical JavaScript
  preloadScript('/register-sw.js');
}

// Helper function to preload CSS
function preloadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  document.head.appendChild(link);
}

// Helper function to preload fonts
function preloadFont(href, format) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.href = href;
  link.type = `font/${format}`;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Helper function to preload images
function preloadImage(src) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

// Helper function to preload scripts
function preloadScript(src) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = src;
  document.head.appendChild(link);
}

// Execute preload when the browser is idle
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(preloadResources);
} else {
  // Fallback for browsers that don't support requestIdleCallback
  setTimeout(preloadResources, 1);
}

// Prefetch pages that are likely to be visited
function prefetchPages() {
  const pagesToPrefetch = [
    '/routes/equipment',
    '/routes/how-it-works',
    '/routes/profile'
  ];
  
  pagesToPrefetch.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

// Execute prefetch after critical resources are loaded
window.addEventListener('load', () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetchPages);
  } else {
    setTimeout(prefetchPages, 2000);
  }
}); 