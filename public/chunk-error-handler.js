/**
 * chunk-error-handler.js
 * 
 * Detects and recovers from webpack chunk load errors by
 * implementing retry logic and cache clearing capabilities.
 * 
 * Add to your _app.js or layout.tsx file to enable automatic recovery
 * from chunk load errors that can happen during deployment or development.
 */

(function() {
  // Configuration
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  const CACHE_BUSTING = true;
  const DEBUG = false;
  
  // Keep track of failed chunks to prevent infinite loops
  const failedChunks = new Set();
  const retryCount = {};
  const pendingScripts = new Map();
  const processedUrls = new Set();
  
  // Store original chunk load error handler
  const originalChunkLoadError = window.__NEXT_CHUNK_LOAD_ERROR;
  
  // Patch fetch to handle HMR chunk 404s
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Only intercept webpack hot update requests
    if (typeof url === 'string' && 
        (url.includes('webpack.hot-update.json') || 
         url.includes('webpack.js'))) {
      
      return originalFetch(url, options)
        .then(response => {
          if (!response.ok && response.status === 404) {
            if (DEBUG) console.log('[ChunkErrorHandler] Intercepted 404 fetch for:', url);
            // Don't show 404 errors in console for these resources
            return new Response('{"c": {}}', {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return response;
        })
        .catch(error => {
          if (DEBUG) console.log('[ChunkErrorHandler] Fetch error for:', url, error);
          // Return empty successful response
          return new Response('{"c": {}}', { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        });
    }
    
    // Pass through all other requests
    return originalFetch(url, options);
  };
  
  // Clear all application caches to force a fresh load
  async function clearCaches() {
    if (DEBUG) console.log('[ChunkErrorHandler] Clearing caches to force a fresh page load');
    
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
        if (DEBUG) console.log('[ChunkErrorHandler] Successfully cleared all caches');
      } catch (e) {
        console.error('[ChunkErrorHandler] Failed to clear caches:', e);
      }
    }
  }
  
  // Create a proxy for chunk loading
  function createScriptProxy(originalSrc) {
    if (processedUrls.has(originalSrc)) return;
    processedUrls.add(originalSrc);
    
    const scriptId = `script-proxy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add cache busting parameter
    const cacheBuster = `?t=${Date.now()}`;
    const src = originalSrc.includes('?') 
      ? originalSrc.replace(/\?(.*)$/, cacheBuster) 
      : originalSrc + cacheBuster;
    
    // Create a new script element
    const script = document.createElement('script');
    script.src = src;
    script.id = scriptId;
    script.async = true;
    script.onerror = () => {
      const count = retryCount[originalSrc] || 0;
      
      if (count < MAX_RETRIES) {
        retryCount[originalSrc] = count + 1;
        if (DEBUG) console.log(`[ChunkErrorHandler] Retrying ${originalSrc} (${retryCount[originalSrc]}/${MAX_RETRIES})`);
        
        // Remove the failed script
        const oldScript = document.getElementById(scriptId);
        if (oldScript) oldScript.remove();
        
        // Clear pendingScripts entry
        pendingScripts.delete(originalSrc);
        
        // Try again after delay
        setTimeout(() => {
          createScriptProxy(originalSrc);
        }, RETRY_DELAY);
      } else {
        failedChunks.add(originalSrc);
        if (DEBUG) console.log(`[ChunkErrorHandler] Failed to load ${originalSrc} after ${MAX_RETRIES} attempts`);
        
        // For webpack.js specifically, create an empty implementation to prevent further errors
        if (originalSrc.includes('webpack.js')) {
          const placeholderScript = document.createElement('script');
          placeholderScript.textContent = `
            // Empty webpack placeholder to prevent errors
            window.__webpack_require__ = function() {};
            window.__webpack_chunk_load__ = function() { return Promise.resolve(); };
            window.__webpack_modules__ = {};
            window.__webpack_public_path__ = '/';
          `;
          document.head.appendChild(placeholderScript);
        }
      }
    };
    
    pendingScripts.set(originalSrc, script);
    document.head.appendChild(script);
  }
  
  // Handle chunk load errors with enhanced retry logic
  function handleChunkError(error) {
    console.error('[ChunkErrorHandler] Chunk load error detected:', error);
    
    // Extract the chunk name from the error
    const errorText = error.message || error.toString();
    const chunkMatch = errorText.match(/Loading chunk (\d+|[a-zA-Z0-9_-]+) failed/);
    const chunkId = chunkMatch ? chunkMatch[1] : 'unknown';
    
    // Add to failed chunks set
    failedChunks.add(chunkId);
    
    // Check if we should retry
    if (retryCount[chunkId] < MAX_RETRIES) {
      retryCount[chunkId]++;
      
      console.log(`[ChunkErrorHandler] Retrying (${retryCount[chunkId]}/${MAX_RETRIES})...`);
      
      // Add a delay before retry
      setTimeout(async () => {
        if (CACHE_BUSTING) {
          await clearCaches();
        }
        
        // Force reload, with a cache-busting query parameter
        const reloadUrl = new URL(window.location.href);
        reloadUrl.searchParams.set('_cache_bust', Date.now());
        window.location.href = reloadUrl.toString();
      }, RETRY_DELAY);
    } else {
      console.error('[ChunkErrorHandler] Maximum retries reached. Please try manually refreshing the page.');
      
      // Create a user-friendly error notification
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '20px';
      errorDiv.style.left = '50%';
      errorDiv.style.transform = 'translateX(-50%)';
      errorDiv.style.backgroundColor = '#f44336';
      errorDiv.style.color = 'white';
      errorDiv.style.padding = '15px 20px';
      errorDiv.style.borderRadius = '5px';
      errorDiv.style.zIndex = '9999';
      errorDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      errorDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <div>⚠️</div>
          <div>
            <div style="font-weight:bold">Failed to load page content</div>
            <div style="font-size:14px;margin-top:5px">Please <a href="#" style="color:white;text-decoration:underline" onclick="window.location.reload(true)">refresh the page</a> or try again later.</div>
          </div>
        </div>
      `;
      document.body.appendChild(errorDiv);
      
      // Call original handler if it exists
      if (typeof originalChunkLoadError === 'function') {
        originalChunkLoadError(error);
      }
    }
    
    // Always rethrow the error for proper error tracking
    throw error;
  }
  
  // Override the Next.js chunk load error handler
  window.__NEXT_CHUNK_LOAD_ERROR = handleChunkError;
  
  // Check for ongoing chunk failures on page load
  window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const cacheBust = urlParams.get('_cache_bust');
    
    if (cacheBust) {
      // Clean up the URL by removing the cache bust parameter
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('_cache_bust');
      window.history.replaceState({}, document.title, cleanUrl.toString());
      
      console.log('[ChunkErrorHandler] Page reloaded after cache busting');
    }
  });
  
  // Also attach to global error handling, since some chunk errors might not trigger __NEXT_CHUNK_LOAD_ERROR
  window.addEventListener('error', (event) => {
    if (
      event.error && 
      (event.error.name === 'ChunkLoadError' || event.message?.includes('Loading chunk') || event.message?.includes('ChunkLoadError'))
    ) {
      event.preventDefault();
      handleChunkError(event.error || new Error(event.message));
    }
  });
  
  // Intercept script errors
  window.addEventListener('error', function(event) {
    // Only process script loading errors
    if (!event.target || event.target.tagName !== 'SCRIPT') return;
    
    const src = event.target.src || '';
    if (!src) return;
    
    // Check if this is a Next.js resource
    if (src.includes('/_next/') || src.includes('webpack')) {
      // Prevent the error from showing in console
      event.preventDefault();
      
      if (DEBUG) console.log('[ChunkErrorHandler] Intercepted script error:', src);
      
      // Create a proxy script to retry loading
      createScriptProxy(src);
    }
  }, true); // Use capturing phase
  
  // For development environment only - handle 404 on webpack HMR updates
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Create a simple object to handle Next.js HMR
    window.__NEXT_HMR_HANDLER = {
      isUpdateAvailable: () => false,
      canApplyUpdates: () => false,
      getEventId: () => '',
      onBuildOk: () => {},
      onBuildError: () => {},
      onBeforeRefresh: () => {}
    };
  }
  
  if (DEBUG) console.log('[ChunkErrorHandler] Initialized');
})(); 