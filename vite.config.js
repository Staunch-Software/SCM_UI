import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // ** ADD THIS PROXY CONFIGURATION **
    proxy: {
      // Forward all requests starting with /api to your backend
      '/api': {
        target: 'http://127.0.0.1:8000', // Your FastAPI server address
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false,      // Recommended for local development
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})