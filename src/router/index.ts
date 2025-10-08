import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '@/views/AuthView.vue'
import WorldsView from '@/views/WorldsView.vue'
import WorldEditorView from '@/views/WorldEditorView.vue'

const routes = [
  { path: '/login', component: AuthView },
  { path: '/worlds', component: WorldsView },
  { path: '/world/:id', component: WorldEditorView, props: true },
  { path: '/', redirect: '/login' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})