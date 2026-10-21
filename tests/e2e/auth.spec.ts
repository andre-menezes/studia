import { expect, test } from '@playwright/test'
import { SEED_USER, login } from './helpers'

test('credenciais inválidas mostram o erro traduzido e mantêm o usuário no login', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(SEED_USER.email)
  await page.getByLabel('Senha').fill('senha-errada')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByText('E-mail ou senha inválidos.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sair' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})

test('a sessão sobrevive a um reload (refresh via cookie) e termina no logout', async ({ page }) => {
  await login(page)

  await page.reload()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})
