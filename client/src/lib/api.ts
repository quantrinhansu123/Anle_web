const BASE_URL = 'http://localhost:3000/api/v1';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
      ...result // Use the already parsed result as the error body
    });
    throw new Error(result.error?.message || result.message || 'API request failed');
  }

  return result.data;
}
