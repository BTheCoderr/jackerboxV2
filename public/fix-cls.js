// Script to fix layout shifts by pre-calculating dimensions
(function() {
  // Function to set container heights based on aspect ratios
  function setContainerHeights() {
    // Fix image container heights
    const imageContainers = document.querySelectorAll('.aspect-\\[4\\/3\\]');
    imageContainers.forEach(container => {
      const width = container.offsetWidth;
      const height = width * (3/4);
      container.style.height = `${height}px`;
    });
    
    // Fix grid layout
    const gridContainers = document.querySelectorAll('.grid');
    gridContainers.forEach(grid => {
      // Force grid layout calculation
      grid.style.display = 'grid';
    });
  }
  
  // Run immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(setContainerHeights, 0);
  } else {
    document.addEventListener('DOMContentLoaded', setContainerHeights);
  }
  
  // Run again after images might have loaded
  window.addEventListener('load', setContainerHeights);
  
  // Run on resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setContainerHeights, 100);
  });
})(); 