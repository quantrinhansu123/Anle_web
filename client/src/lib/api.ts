const PRODUCTION_API_URL = 'https://anle-web-server.vercel.app/api/v1';

const resolveBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (!configured) {
    return import.meta.env.DEV ? '/api/v1' : PRODUCTION_API_URL;
  }

  // Avoid mixed-content/network failures on deployed HTTPS clients when env accidentally points to localhost HTTP.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalClient = hostname === 'localhost' || hostname === '127.0.0.1';
    const isHttpsClient = window.location.protocol === 'https:';
    const isLocalApi =
      configured.startsWith('http://localhost') ||
      configured.startsWith('http://127.0.0.1');

    if (!isLocalClient && isHttpsClient && isLocalApi) {
      return PRODUCTION_API_URL;
    }

    // A relative API URL on the deployed frontend bypasses Vercel rewrites and
    // returns the frontend's HTML. Point it directly at the API deployment.
    if (!isLocalClient && configured.startsWith('/')) {
      return PRODUCTION_API_URL;
    }

    // Some Windows environments fail resolving localhost but 127.0.0.1 works.
    if (isLocalClient && configured.startsWith('http://localhost')) {
      return configured.replace('http://localhost', 'http://127.0.0.1');
    }
  }

  return configured;
};

const BASE_URL = resolveBaseUrl();

const buildHeaders = (options: RequestInit) => {
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

  return headers;
};

const apiRequest = async (endpoint: string, options: RequestInit, headers: Record<string, string>) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });
  return { response, url };
};

const parseApiResponse = async (response: Response, url: string) => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const body = await response.text().catch(() => '');
    const preview = body.trim().slice(0, 120);
    return {
      message: `API did not return JSON (${response.status}) from ${url}${preview ? `: ${preview}` : ''}`,
    };
  }

  try {
    return await response.json();
  } catch (e: any) {
    return { message: `Failed to parse response body: ${e.message}` };
  }
};

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = buildHeaders(options);
  const { response, url } = await apiRequest(endpoint, options, headers);

  // Attempt to parse the response body. This will be `result.data` on success,
  // or the error body on failure.
  const result = await parseApiResponse(response, url);

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
  const headers = buildHeaders(options);
  const { response, url } = await apiRequest(endpoint, options, headers);
  const result = await parseApiResponse(response, url);

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
