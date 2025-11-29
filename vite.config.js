import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // host: true,          // ← REQUIRED for LAN access
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        //target: 'http://192.168.16.103:8000',
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
