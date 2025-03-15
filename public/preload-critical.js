// This script runs before any other JavaScript to preload critical resources
(function() {
  // Helper function to create and append link elements
  function createLink(rel, href, as, type, crossOrigin) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    if (type) link.type = type;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    document.head.appendChild(link);
  }

  // Preload critical images
  createLink('preload', '/icons/icon-192x192.png', 'image', 'image/png');
  
  // Preload critical CSS
  const criticalCSS = document.querySelector('link[rel="stylesheet"]');
  if (criticalCSS) {
    criticalCSS.setAttribute('media', 'all');
    criticalCSS.setAttribute('fetchpriority', 'high');
  }
  
  // Preload critical routes for faster navigation
  const criticalRoutes = [
    '/routes/equipment',
    '/routes/dashboard',
    '/auth/login'
  ];
  
  criticalRoutes.forEach(route => {
    createLink('prefetch', route);
  });
  
  // Add connection hints for third-party domains
  const domains = [
    'res.cloudinary.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  
  domains.forEach(domain => {
    createLink('preconnect', `https://${domain}`, null, null, domain.includes('gstatic') ? 'anonymous' : null);
    createLink('dns-prefetch', `https://${domain}`);
  });
  
  // Detect slow connections and adjust loading strategy
  if (navigator.connection && 
      (navigator.connection.saveData || 
       (navigator.connection.effectiveType && navigator.connection.effectiveType.includes('2g')))) {
    // For slow connections, disable prefetching
    document.querySelectorAll('link[rel=prefetch]').forEach(link => {
      link.remove();
    });
    
    // Add a class to the body for CSS optimizations
    document.body.classList.add('slow-connection');
  }
})(); 