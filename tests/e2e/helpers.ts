import { expect, type Page } from '@playwright/test'

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
