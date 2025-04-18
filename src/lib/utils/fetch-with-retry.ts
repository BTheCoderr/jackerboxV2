/**
 * Fetch with retry functionality for API calls
 * Helps handle temporary connection issues and server errors
 */

interface FetchWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffFactor?: number;
  retryStatusCodes?: number[];
}

/**
 * Enhanced fetch function with retry capability
 */
export async function fetchWithRetry(
  url: string, 
  options?: RequestInit,
  retryOptions?: FetchWithRetryOptions
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 500,
    backoffFactor = 1.5,
    retryStatusCodes = [408, 429, 500, 502, 503, 504]
  } = retryOptions || {};

  let lastError: Error | null = null;
  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add cache control headers to prevent caching issues
      const enhancedOptions: RequestInit = {
        ...options,
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Retry-Attempt': attempt.toString()
        }
      };
      
      const response = await fetch(url, enhancedOptions);
      
      // Return if successful or if it's not a retryable status code
      if (response.ok || !retryStatusCodes.includes(response.status)) {
        return response;
      }
      
      // If we get here, we have a retryable error status
      lastError = new Error(`HTTP error: ${response.status} ${response.statusText}`);
      
      // If this was our last retry, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      console.warn(`Fetch attempt ${attempt + 1}/${maxRetries + 1} failed for ${url}. Retrying in ${currentDelay}ms...`);
      
      // Wait before next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffFactor, 10000); // Cap at 10 seconds
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this was our last retry, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      console.warn(`Fetch attempt ${attempt + 1}/${maxRetries + 1} failed for ${url}: ${lastError.message}. Retrying in ${currentDelay}ms...`);
      
      // Wait before next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffFactor, 10000);
    }
  }
  
  // This should never be reached but TypeScript needs it
  throw lastError || new Error('Unknown error occurred during fetch');
} 