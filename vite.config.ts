import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 🔹 ДОБАВЛЕНО
import tailwindcss from "@tailwindcss/vite"; // Импортируем плагин

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Добавляем плагин в массив
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 🔹 ДОБАВЛЕНО
    },
  },
})