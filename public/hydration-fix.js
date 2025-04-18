/**
 * Hydration Fix Script
 * 
 * This script runs before React hydration to fix common issues that cause
 * hydration mismatches between server and client rendering.
 */

(function() {
  // Fix ID attributes that might be inconsistent or missing
  function fixIDAttributes() {
    // Fix critical CSS ID
    const criticalCssElements = document.querySelectorAll('style:not([id])');
    criticalCssElements.forEach(function(style) {
      if (style.textContent && style.textContent.includes('--font-sans')) {
        style.id = 'critical-css';
      }
    });
  }
  
  // Fix inconsistent style attributes
  function fixStyleAttributes() {
    const styles = document.querySelectorAll('style[type="text/css"]');
    styles.forEach(function(style) {
      style.removeAttribute('type');
    });
  }

  // Fix font awesome or other external CSS that might cause inconsistencies
  function fixExternalCSSIssues() {
    // Add specific attribute to font awesome styles to help with identification
    const faStyles = document.querySelectorAll('style[data-fa-v4-font-face], style[data-emotion]');
    faStyles.forEach(function(style) {
      style.setAttribute('data-hydration-safe', 'true');
    });

    // Add a class to the html element to signal to our code that we've run this fix
    document.documentElement.classList.add('hydration-fixed');
  }

  // Fix data-* attributes that might change between server and client
  function fixDataAttributes() {
    const elementsWithDataAttrs = document.querySelectorAll('[data-random], [data-timestamp]');
    elementsWithDataAttrs.forEach(function(el) {
      if (el.hasAttribute('data-random')) {
        el.removeAttribute('data-random');
      }
      if (el.hasAttribute('data-timestamp')) {
        el.removeAttribute('data-timestamp');
      }
    });
  }

  // Fix badge elements that might have server/client differences
  function fixBadgeElements() {
    // Focus on status indicators that might have dynamically changing content
    const statusBadges = document.querySelectorAll('.status-badge, [data-status]');
    statusBadges.forEach(function(badge) {
      badge.setAttribute('suppressHydrationWarning', 'true');
    });
  }

  // Function to run all fixes
  function runAllFixes() {
    try {
      fixIDAttributes();
      fixStyleAttributes();
      fixExternalCSSIssues();
      fixDataAttributes();
      fixBadgeElements();
      
      // Signal that fixes have been applied
      window.__NEXT_HYDRATION_FIXED = true;
      
      console.log('[Hydration Fix] Applied hydration fixes');
    } catch (error) {
      console.error('[Hydration Fix] Error applying fixes:', error);
    }
  }

  // Run immediately and also on DOMContentLoaded as a backup
  runAllFixes();
  document.addEventListener('DOMContentLoaded', runAllFixes);
})(); 