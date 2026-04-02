const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api/v1';

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

  const response = await fetch(url, {
    ...options,
    headers,
  });

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
    throw new Error(result.error?.message || result.message || 'API request failed');
  }

  // Debug: log the result to find why .data might be missing
  console.log('API Success:', { url, result });

  return result.data;
}
