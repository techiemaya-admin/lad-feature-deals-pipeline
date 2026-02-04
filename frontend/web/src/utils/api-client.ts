/**
 * API Client Utility
 * Centralized fetch wrapper with base endpoint configuration
 */

const getBaseUrl = (): string => {
  // For server-side (middleware, API routes)
  if (typeof window === 'undefined') {
    // Use BACKEND_INTERNAL_URL for server-side calls (Next.js middleware -> Express backend)
    const serverUrl = process.env.BACKEND_INTERNAL_URL || 
                      process.env.NEXT_PUBLIC_BACKEND_URL || 
                      process.env.NEXT_PUBLIC_API_URL || 
                      'http://localhost:3004';
    console.log('[API Client] Server-side base URL:', serverUrl);
    return serverUrl;
  }
  
  // For client-side (browser -> Next.js API routes)
  const clientUrl = process.env.NEXT_PUBLIC_API_URL || 
                    process.env.NEXT_PUBLIC_BACKEND_URL || 
                    'http://localhost:3000';
  console.log('[API Client] Client-side base URL:', clientUrl);
  return clientUrl;
};

export interface FetchOptions extends RequestInit {
  token?: string;
  includeCredentials?: boolean;
}

/**
 * Centralized fetch wrapper for API calls
 * Handles base URL, headers, and token injection
 */
export async function apiFetch(
  endpoint: string,
  options: FetchOptions = {}
) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const {
    token,
    includeCredentials = true,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const headers = new Headers(customHeaders as HeadersInit);

  // Set default content type if not provided
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add authorization header if token is provided
  if (token) {
    // Strip "Bearer " prefix if it already exists to avoid duplication
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    headers.set('Authorization', `Bearer ${cleanToken}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: includeCredentials ? 'include' : 'omit',
    });

    return response;
  } catch (error) {
    console.error(`[API Client] Error fetching ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Validate authentication token
 * Calls the /api/auth/me endpoint to verify token is valid and authorized
 * NOTE: For middleware (server-side), this goes directly to backend
 */
export async function validateAuthToken(token: string): Promise<boolean> {
  try {
    // For server-side (middleware), call backend directly
    // For client-side, go through Next.js API route
    const baseUrl = typeof window === 'undefined' 
      ? (process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004')
      : '';  // Empty string for client-side = relative URL
    
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    const url = `${baseUrl}/api/auth/me`;
    
    console.log('[validateAuthToken] Calling:', url, 'token:', cleanToken.substring(0, 20) + '...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[validateAuthToken] Response:', response.status, response.ok);
    return response.ok;
  } catch (error) {
    console.error('[API Client] Token validation error:', error);
    return false;
  }
}

/**
 * Get current authenticated user
 * Returns user data if token is valid
 * NOTE: For middleware (server-side), this goes directly to backend
 */
export async function getCurrentUser(token: string): Promise<any> {
  try {
    // For server-side (middleware), call backend directly
    // For client-side, go through Next.js API route
    const baseUrl = typeof window === 'undefined' 
      ? (process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004')
      : '';  // Empty string for client-side = relative URL
    
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API Client] Get current user error:', error);
    return null;
  }
}

/**
 * Make an API request with automatic token handling
 * Useful for authenticated API calls
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null; status: number }> {
  try {
    const response = await apiFetch(endpoint, options);

    if (!response.ok) {
      return {
        data: null,
        error: new Error(`API Error: ${response.status} ${response.statusText}`),
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
      status: 0,
    };
  }
}
