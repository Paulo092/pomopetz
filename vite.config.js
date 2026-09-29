import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      // Usa a API moderna do Sass (remove o aviso "legacy-js-api")
      scss: { api: 'modern-compiler' }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
