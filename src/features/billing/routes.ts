import type { RouteRecordRaw } from 'vue-router'

/** Route name other features use to link to the plans page. */
export const BILLING_PLANS_ROUTE = 'billing-plans'

export const billingRoutes: RouteRecordRaw[] = [
  {
    path: '/plans',
    name: BILLING_PLANS_ROUTE,
    component: () => import('./views/PlansView.vue'),
  },
  {
    path: '/billing/return',
    name: 'billing-return',
    component: () => import('./views/BillingReturnView.vue'),
  },
]
