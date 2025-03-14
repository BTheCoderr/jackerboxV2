// Preload critical resources for better performance
(function() {
  // Preload critical images
  const imagesToPreload = [
    '/icons/icon-192x192.png',
    '/logo.png'
  ];
  
  // Preload critical stylesheets
  const stylesToPreload = [
    '/_next/static/css/app.css'
  ];
  
  // Preload critical JavaScript
  const scriptsToPreload = [
    '/_next/static/chunks/main.js',
    '/_next/static/chunks/webpack.js'
  ];
  
  // Preload critical fonts
  const fontsToPreload = [
    'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap'
  ];
  
  // Function to create preload link
  function createPreloadLink(href, as) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (as === 'font') {
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    }
    
    return link;
  }
  
  // Preload images
  imagesToPreload.forEach(image => {
    const link = createPreloadLink(image, 'image');
    document.head.appendChild(link);
  });
  
  // Preload stylesheets
  stylesToPreload.forEach(style => {
    const link = createPreloadLink(style, 'style');
    document.head.appendChild(link);
  });
  
  // Preload scripts
  scriptsToPreload.forEach(script => {
    const link = createPreloadLink(script, 'script');
    document.head.appendChild(link);
  });
  
  // Preload fonts
  fontsToPreload.forEach(font => {
    const link = createPreloadLink(font, 'font');
    document.head.appendChild(link);
  });
})(); 