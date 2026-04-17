
export const uploadService = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // We bypass the JSON stringification in apiFetch by making a raw fetch,
    // or using apiFetch if it supports FormData. Let's do raw fetch to be safe,
    // using the token from localStorage.
    const token = localStorage.getItem('token');

    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'File upload failed');
    }

    const data = await response.json();
    return data.data.url;
  },
};
