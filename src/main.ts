import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './style.css'

// Импорт Supabase для инициализации сессии
import { supabase } from './lib/supabase'

// Ждём восстановления сессии перед монтированием приложения
supabase.auth.getSession().then(() => {
  createApp(App).use(router).mount('#app')
})