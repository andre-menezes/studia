import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { initSession } from './bootstrap/initSession'
import { i18n } from '@/shared/i18n'
import { authMessages } from '@/features/auth'
import { billingMessages } from '@/features/billing'
import { studiesMessages } from '@/features/studies'
import '@/shared/styles/main.css'
import { router } from './router'

for (const [locale, messages] of Object.entries(authMessages)) {
  i18n.global.mergeLocaleMessage(locale, messages as Record<string, unknown>)
}
for (const [locale, messages] of Object.entries(billingMessages)) {
  i18n.global.mergeLocaleMessage(locale, messages as Record<string, unknown>)
}
for (const [locale, messages] of Object.entries(studiesMessages)) {
  i18n.global.mergeLocaleMessage(locale, messages as Record<string, unknown>)
}

// Async function instead of top-level await: Vite's default build target does not support it.
async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(i18n)

  await initSession()
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap().catch((error: unknown) => {
  console.error('[studia] bootstrap failed', error)
})
