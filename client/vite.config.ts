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
      }
    }
  }
})
