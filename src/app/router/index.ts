import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes, useAuthStore } from '@/features/auth'
import { studiesRoutes } from '@/features/studies'

export const router = createRouter({
  history: createWebHistory(),
  routes: [...authRoutes, ...studiesRoutes],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (auth.status === 'INITIALIZING' || auth.status === 'UNKNOWN') {
    return true
  }
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'studies-home' }
  }
  return true
})
