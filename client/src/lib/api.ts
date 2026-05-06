const resolveBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (!configured) return 'http://localhost:3006/api/v1';

  // Avoid mixed-content/network failures on deployed HTTPS clients when env accidentally points to localhost HTTP.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalClient = hostname === 'localhost' || hostname === '127.0.0.1';
    const isHttpsClient = window.location.protocol === 'https:';
    const isLocalApi =
      configured.startsWith('http://localhost') ||
      configured.startsWith('http://127.0.0.1');

    if (!isLocalClient && isHttpsClient && isLocalApi) {
      return '/api/v1';
    }

    // Some Windows environments fail resolving localhost but 127.0.0.1 works.
    if (isLocalClient && configured.startsWith('http://localhost')) {
      return configured.replace('http://localhost', 'http://127.0.0.1');
    }
  }

  return configured;
};

const BASE_URL = resolveBaseUrl();

const buildSameOriginFallbackUrl = (endpoint: string) => {
  // Use same-origin /api/v1 to leverage Vite proxy in dev and avoid mixed content / DNS quirks.
  return `/api/v1${endpoint}`;
};

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    // Retry once via same-origin route (works with Vite proxy; also safer for HTTPS deployments).
    const fallbackUrl = buildSameOriginFallbackUrl(endpoint);
    try {
      response = await fetch(fallbackUrl, {
        ...options,
        headers,
      });
    } catch (fallbackErr) {
      console.error('API Network Error:', { url, fallbackUrl, err, fallbackErr });
      throw fallbackErr;
    }
  }

  // Attempt to parse the response body. This will be `result.data` on success,
  // or the error body on failure.
  let result: any;
  try {
    result = await response.json();
  } catch (e: any) {
    // If parsing fails (e.g., non-JSON response for an error), create a fallback.
    result = { message: `Failed to parse response body: ${e.message}` };
  }

  if (!response.ok) {
    console.error('API Error:', {
      status: response.status,
      url,
      ...result
    });
    let errorMessage = result.error?.message || result.message || 'API request failed';
    
    if (result.errors && typeof result.errors === 'object') {
      const fieldErrors = Object.entries(result.errors)
        .map(([field, msgs]) => {
          // Format field name: "shipment_id" -> "Shipment"
          let fieldName = field.replace(/_/g, ' ');
          fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          if (fieldName.toLowerCase().endsWith(' id')) {
            fieldName = fieldName.slice(0, -3).trim();
          }

          let msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          const msgLower = msgStr.toLowerCase();
          
          // Map common Zod errors to user-friendly messages
          if (msgLower.includes('invalid uuid') || msgLower.includes('required')) {
            return `${fieldName} is missing or required`;
          }
          if (msgLower.includes('expected number, received nan')) {
            return `${fieldName} must be a valid number`;
          }
          if (msgLower.includes('string must contain at least 1 character')) {
            return `${fieldName} cannot be empty`;
          }
          
          return `${fieldName}: ${msgStr}`;
        })
        .join(' • ');
        
      if (fieldErrors) {
        errorMessage = `Validation failed: ${fieldErrors}`;
      }
    }
    
    throw new Error(errorMessage);
  }

  return result.data;
}

export type ApiPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** For endpoints that respond with `{ success, data: T[], pagination }` (see `paginatedResponse` on the server). */
export async function apiFetchPaginated<TItem>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ items: TItem[]; pagination: ApiPagination }> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    const fallbackUrl = buildSameOriginFallbackUrl(endpoint);
    try {
      response = await fetch(fallbackUrl, {
        ...options,
        headers,
      });
    } catch (fallbackErr) {
      console.error('API Network Error:', { url, fallbackUrl, err, fallbackErr });
      throw fallbackErr;
    }
  }

  let result: any;
  try {
    result = await response.json();
  } catch (e: any) {
    result = { message: `Failed to parse response body: ${e.message}` };
  }

  if (!response.ok) {
    let errorMessage = result.error?.message || result.message || 'API request failed';
    if (result.errors && typeof result.errors === 'object') {
      const fieldErrors = Object.entries(result.errors)
        .map(([field, msgs]) => {
          let fieldName = field.replace(/_/g, ' ');
          fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          return `${fieldName}: ${msgStr}`;
        })
        .join(' • ');
      if (fieldErrors) errorMessage = `Validation failed: ${fieldErrors}`;
    }
    throw new Error(errorMessage);
  }

  const pagination = result.pagination as ApiPagination | undefined;
  if (!pagination || typeof pagination.total !== 'number') {
    throw new Error('Invalid paginated API response');
  }

  return { items: (Array.isArray(result.data) ? result.data : []) as TItem[], pagination };
}
