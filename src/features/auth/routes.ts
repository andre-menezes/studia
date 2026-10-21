import type { RouteRecordRaw } from 'vue-router'

/** `guestOnly`: public routes that redirect home when already signed in. */
export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('./views/SignUpView.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('./views/ForgotPasswordView.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('./views/ResetPasswordView.vue'),
    meta: { public: true, guestOnly: true },
  },
]
