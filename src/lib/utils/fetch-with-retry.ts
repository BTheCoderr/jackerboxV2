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
 * Enhanced fetch utility with retry capability and mock responses for development
 */

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffFactor?: number;
  retryStatusCodes?: number[];
  retryCondition?: (error: any, attempt: number) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffFactor: 1.5, // Exponential backoff
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  retryCondition: () => true // Retry on any error by default
};

/**
 * Fetch with automatic retry capability and development mocks
 * @param url The URL to fetch
 * @param options Fetch options
 * @param retryOptions Retry configuration
 * @returns The fetch response
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  // Merge with defaults and ensure all options have values
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries!,
    retryDelay = DEFAULT_OPTIONS.retryDelay!,
    backoffFactor = DEFAULT_OPTIONS.backoffFactor!,
    retryStatusCodes = DEFAULT_OPTIONS.retryStatusCodes!,
    retryCondition = DEFAULT_OPTIONS.retryCondition!
  } = { ...DEFAULT_OPTIONS, ...retryOptions };
  
  // For development, check if we should use mock data
  if (process.env.NODE_ENV === 'development') {
    // Mock auth requests
    if (url.includes('/api/auth') || url === '/api/session') {
      console.log(`Mock: Intercepting auth request to ${url}`);
      
      // Return a mock session for auth-related endpoints
      if (url.includes('/api/auth/session') || url === '/api/session') {
        return mockResponse({
          user: {
            id: "mock_user_123",
            name: "Mock User",
            email: "user@example.com",
            image: "https://i.pravatar.cc/150?img=3",
            isAdmin: true,
            userType: "both"
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      }
      
      // For signin endpoints
      if (url.includes('/api/auth/signin') || url.includes('/api/auth/callback')) {
        return mockResponse({ 
          url: "/dashboard",
          status: 200
        });
      }
      
      // For other auth endpoints, just return success
      return mockResponse({ success: true });
    }
  }
  
  let lastError: Error | null = null;
  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add diagnostic headers in development
      const enhancedOptions: RequestInit = {
        ...options,
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Retry-Attempt': attempt.toString()
        }
      };
      
      // Log the attempt in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetch attempt ${attempt + 1}/${maxRetries + 1} for ${url}`);
      }
      
      const response = await fetch(url, enhancedOptions);
      
      // Return if successful or if it's not a retryable status code
      if (response.ok || !retryStatusCodes.includes(response.status)) {
        return response;
      }
      
      // If we get here, we have a retryable error status
      const errorText = await response.text();
      lastError = new Error(`HTTP error ${response.status}: ${errorText}`);
      
      // Log the error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`Fetch attempt ${attempt + 1} failed:`, lastError.message);
      }
      
      // If this was our last retry, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffFactor, 10000); // Cap at 10 seconds
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log the error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`Fetch attempt ${attempt + 1} failed:`, lastError.message);
      }
      
      // Break if we've used all retry attempts or if retry condition is not met
      if (
        attempt >= maxRetries || 
        !retryCondition(error, attempt)
      ) {
        break;
      }
      
      // Wait before the next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffFactor, 10000);
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Helper to create a mock response for development
 */
function mockResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 