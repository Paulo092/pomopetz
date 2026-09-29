import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Caminhos relativos: o site funciona em qualquer subpasta,
  // como https://paulo092.github.io/pomopetz/ (GitHub Pages)
  base: './pomopetz',
  plugins: [vue()],
  server: {
    port: 5173,
    host: true
  }
})
