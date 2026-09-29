import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes, useAuthStore } from '@/features/auth'
import { englishCoachRoutes } from '@/features/english-coach'
import { studiesRoutes } from '@/features/studies'

export const router = createRouter({
  history: createWebHistory(),
  routes: [...authRoutes, ...englishCoachRoutes, ...studiesRoutes],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (auth.status === 'INITIALIZING' || auth.status === 'UNKNOWN') {
    return true
  }
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'studies-home' }
  }
  return true
})
