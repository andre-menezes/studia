import { expect, type Page } from '@playwright/test'
import { MOCK_PORT } from './ports'

export const MOCK_API_URL = `http://localhost:${MOCK_PORT}/api/v1`

/** Seed user of tools/mock-server (DX only, never a real account). */
export const SEED_USER = {
  email: 'demo@studia.app',
  password: 'studia123',
}

export async function login(page: Page) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(SEED_USER.email)
  await page.getByLabel('Senha').fill(SEED_USER.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
}

/** Unique per run: the mock keeps state in memory for the whole run. */
export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.local`
}

/** Signs up a fresh account through the UI and lands on the home. */
export async function signUp(page: Page, email = uniqueEmail('user')) {
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Nome' }).fill('Pessoa Nova')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel(/^Senha/).fill('senha-forte-123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  return email
}

/** Walks the 4-step wizard (all week days) and waits for the home success alert. */
export async function createStudyViaWizard(page: Page, title: string) {
  await page.getByRole('button', { name: 'Criar Estudo' }).first().click()
  await expect(page.getByText('Como vamos chamar esse Estudo?')).toBeVisible()

  await page.getByRole('textbox', { name: 'Nome' }).fill(title)
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByRole('textbox', { name: 'Objetivo' }).fill('Conversar com confiança em 6 meses')
  await page.getByRole('button', { name: 'Continuar' }).click()

  for (const day of ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']) {
    const toggle = page.getByRole('button', { name: day, exact: true })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  }
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByText('Revise antes de criar')).toBeVisible()
  await expect(page.getByText(title)).toBeVisible()
  await page.getByRole('button', { name: 'Criar Estudo' }).click()
  await expect(page.getByText('Estudo criado.')).toBeVisible()
}
