import { defineConfig, devices } from '@playwright/test'

const MOCK_PORT = 3100
const APP_PORT = 5180
const APP_URL = `http://localhost:${APP_PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: APP_URL,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'bun run mock',
      url: `http://localhost:${MOCK_PORT}/api/v1/auth/me`,
      env: { MOCK_PORT: String(MOCK_PORT), MOCK_CORS_ORIGIN: APP_URL },
      reuseExistingServer: false,
    },
    {
      command: `bunx vite --port ${APP_PORT} --strictPort`,
      url: APP_URL,
      env: { VITE_API_BASE_URL: `http://localhost:${MOCK_PORT}/api/v1` },
      reuseExistingServer: false,
    },
  ],
})
