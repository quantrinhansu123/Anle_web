import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiOrigin = (() => {
  const configured = process.env.VITE_API_URL
    ? new URL(process.env.VITE_API_URL).origin
    : 'http://127.0.0.1:3003';

  // Keep the dev proxy aligned with the client-side API fallback. On some
  // Windows setups localhost resolves to a different listener than 127.0.0.1.
  return configured.replace('http://localhost', 'http://127.0.0.1');
})();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: apiOrigin,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiOrigin,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, '/api/v1/f/uploads')
      },
      '/avatars': {
        target: apiOrigin,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/avatars/, '/api/v1/f/avatars')
      },
      // Same-origin logo for html2canvas / PDF (avoids AppSheet CORS during capture)
      '/appsheet-brand-logo': {
        target: 'https://www.appsheet.com',
        changeOrigin: true,
        rewrite: () =>
          '/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Fe6a56fae.%E1%BA%A2nh.064359.png',
      },
    }
  }
})
