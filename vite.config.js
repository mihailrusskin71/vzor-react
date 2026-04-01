import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Разрешает доступ с других устройств
    port: 5173, // Порт (можете поменять если занят)
    strictPort: true, // Не менять порт автоматически
    watch: {
      usePolling: true, // Для Docker/WSL, если нужно
    }
  },
  // Опционально: для билда
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})