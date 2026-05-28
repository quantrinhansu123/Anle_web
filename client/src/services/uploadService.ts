import { apiFetch } from '../lib/api';

export const uploadService = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const data = await apiFetch<{ url: string }>('/upload', {
      method: 'POST',
      body: formData,
    });

    if (!data?.url) {
      throw new Error('File upload failed');
    }
    return data.url;
  },
};
