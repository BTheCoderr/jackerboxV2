// Script to fix layout shifts by pre-calculating dimensions
(function() {
  try {
    // Function to set container heights based on aspect ratios
    function setContainerHeights() {
      try {
        // Fix image container heights
        const imageContainers = document.querySelectorAll('.aspect-\\[4\\/3\\]');
        if (imageContainers && imageContainers.length > 0) {
          imageContainers.forEach(container => {
            try {
              const width = container.offsetWidth;
              const height = width * (3/4);
              container.style.height = `${height}px`;
            } catch (err) {
              console.warn('Error setting container height:', err);
            }
          });
        }
        
        // Fix grid layout
        const gridContainers = document.querySelectorAll('.grid');
        if (gridContainers && gridContainers.length > 0) {
          gridContainers.forEach(grid => {
            try {
              // Force grid layout calculation
              grid.style.display = 'grid';
            } catch (err) {
              console.warn('Error setting grid display:', err);
            }
          });
        }
      } catch (err) {
        console.warn('Error in setContainerHeights:', err);
      }
    }
    
    // Run immediately if document is ready
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
  } catch (err) {
    console.warn('Error in fix-cls.js:', err);
  }
})(); 