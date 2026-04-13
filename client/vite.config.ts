import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ? new URL(process.env.VITE_API_URL).origin : 'http://localhost:3006',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_URL ? new URL(process.env.VITE_API_URL).origin : 'http://localhost:3006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, '/api/v1/f/uploads')
      },
      '/avatars': {
        target: process.env.VITE_API_URL ? new URL(process.env.VITE_API_URL).origin : 'http://localhost:3006',
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
