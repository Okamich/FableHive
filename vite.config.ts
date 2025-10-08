import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 🔹 ДОБАВЛЕНО

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 🔹 ДОБАВЛЕНО
    },
  },
})