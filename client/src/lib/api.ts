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
