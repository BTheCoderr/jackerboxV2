/**
 * API client utility with CSRF protection and error handling
 */

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

/**
 * Enhanced fetch function with CSRF token inclusion and retry logic
 */
export async function fetchWithCSRF(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const { 
    method = 'GET',
    headers = {},
    retries = 3,
    retryDelay = 500,
    ...rest
  } = options;

  // Get CSRF token from session storage
  const csrfToken = sessionStorage.getItem('csrfToken');
  
  // Create headers with CSRF token
  const requestHeaders = new Headers(headers);
  
  if (csrfToken) {
    requestHeaders.set('X-CSRF-Token', csrfToken);
  }
  
  // Add default headers
  if (!requestHeaders.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
    requestHeaders.set('Content-Type', 'application/json');
  }

  // Attempt fetch with retries
  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= retries) {
    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        credentials: 'include', // Include cookies for session authentication
        ...rest,
      });

      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay * Math.pow(2, attempts);
        
        console.warn(`Rate limited. Retrying after ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempts++;
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempts >= retries) {
        break;
      }
      
      // Exponential backoff
      const backoffTime = retryDelay * Math.pow(2, attempts);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      attempts++;
    }
  }

  throw lastError || new Error('Failed to fetch after multiple attempts');
}

/**
 * JSON API client with CSRF protection
 */
export const apiClient = {
  async get<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const response = await fetchWithCSRF(url, { ...options, method: 'GET' });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  async post<T>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
    const response = await fetchWithCSRF(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  async put<T>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
    const response = await fetchWithCSRF(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  async delete<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const response = await fetchWithCSRF(url, {
      ...options,
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
};

export default apiClient;
