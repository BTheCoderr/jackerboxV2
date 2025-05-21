/**
 * Utility functions to handle session reset when encountering JWT decryption errors
 */

/**
 * Reset all auth cookies to resolve JWT decryption issues
 * This is typically used when the NEXTAUTH_SECRET has changed or
 * when encountering JWEDecryptionFailed errors
 */
export function resetAuthCookies(): void {
  if (typeof window === 'undefined') return;
  
  // Get all cookies
  const cookies = document.cookie.split(';');
  
  // Clear all nextauth cookies
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Target only nextauth cookies to avoid disrupting other site functionality
    if (name.startsWith('next-auth')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    }
  }
  
  console.log('Auth cookies have been reset. Please refresh the page.');
}

/**
 * Helper to determine if an error is a JWE decryption error
 */
export function isJWEDecryptionError(error: any): boolean {
  if (!error) return false;
  return (
    (error.name === 'JWEDecryptionFailed' || 
     error.message?.includes('decryption operation failed') ||
     error.toString().includes('JWEDecryptionFailed'))
  );
} 