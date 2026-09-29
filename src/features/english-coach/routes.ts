import type { RouteRecordRaw } from 'vue-router'

export const englishCoachRoutes: RouteRecordRaw[] = [
  {
    path: '/english',
    name: 'english-landing',
    component: () => import('./views/EnglishCoachLandingView.vue'),
    meta: { public: true },
  },
  {
    path: '/english/practice',
    name: 'english-practice',
    component: () => import('./views/EnglishCoachPracticeView.vue'),
    meta: { public: true },
  },
]
