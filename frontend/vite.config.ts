import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:8081',
      '/login': 'http://localhost:8081',
      '/oauth2': 'http://localhost:8081',
    }
  }
})
