import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'https://qolbgrvlkadqnfnprbgr.supabase.co',
        changeOrigin: true,
        // ИСПРАВЛЕНО: теперь правильно перенаправляет на Edge Function
        rewrite: (path) => path.replace(/^\/api/, '/functions/v1/api'),
      },
      '/functions': {
        target: 'https://qolbgrvlkadqnfnprbgr.supabase.co',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})