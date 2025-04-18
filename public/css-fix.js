/**
 * CSS Fix for Next.js
 * 
 * This script detects and stops infinite CSS loading loops
 * that can occur in Next.js applications.
 */

(function() {
  // Configuration
  const CSS_REQUEST_THRESHOLD = 10; // Number of repeated requests before intervention
  const MONITORING_PERIOD = 5000;   // 5 seconds monitoring window
  
  // Track CSS requests
  const cssRequests = new Map();
  
  // Intercept fetch requests to watch for CSS loading loops
  const originalFetch = window.fetch;
  
  window.fetch = function(resource, options) {
    // Only track CSS requests
    if (typeof resource === 'string' && 
        (resource.includes('.css') || resource.includes('/_next/static/css/'))) {
      
      // Extract the base URL without the cache-busting parameter
      const baseUrl = resource.split('?')[0];
      
      // Track this request
      if (!cssRequests.has(baseUrl)) {
        cssRequests.set(baseUrl, {
          count: 1,
          timestamps: [Date.now()]
        });
      } else {
        const data = cssRequests.get(baseUrl);
        data.count++;
        data.timestamps.push(Date.now());
        
        // Clean up old timestamps (older than monitoring period)
        const now = Date.now();
        data.timestamps = data.timestamps.filter(ts => now - ts < MONITORING_PERIOD);
        
        // Check for potential infinite loop
        if (data.timestamps.length >= CSS_REQUEST_THRESHOLD) {
          console.warn(`[CSS-Fix] Detected potentially infinite CSS loading loop for: ${baseUrl}`);
          console.warn(`[CSS-Fix] ${data.timestamps.length} requests in the last ${MONITORING_PERIOD/1000} seconds`);
          
          // Attempt to break the loop by adding a style tag with the missing CSS path
          const styleId = `css-fix-${baseUrl.replace(/[^a-z0-9]/gi, '-')}`;
          
          if (!document.getElementById(styleId)) {
            console.info(`[CSS-Fix] Adding placeholder style to prevent further requests`);
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = '/* Placeholder to prevent infinite CSS loading */';
            document.head.appendChild(style);
            
            // Create a link element that successfully "loads" the CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = baseUrl;
            link.setAttribute('data-css-fix', 'true');
            document.head.appendChild(link);
            
            // Dispatch load event for the link
            setTimeout(() => {
              const event = new Event('load');
              link.dispatchEvent(event);
            }, 50);
            
            // Return a fake successful response
            return Promise.resolve(new Response('/* CSS Fix */', {
              status: 200,
              headers: {
                'Content-Type': 'text/css'
              }
            }));
          }
        }
      }
    }
    
    // Proceed with the original fetch for all other requests
    return originalFetch.apply(this, arguments);
  };
  
  // Periodically clean up the tracking data
  setInterval(() => {
    const now = Date.now();
    cssRequests.forEach((data, url) => {
      data.timestamps = data.timestamps.filter(ts => now - ts < MONITORING_PERIOD);
      if (data.timestamps.length === 0) {
        cssRequests.delete(url);
      }
    });
  }, MONITORING_PERIOD);
  
  console.log('[CSS-Fix] Initialized CSS loading protection');
})(); 