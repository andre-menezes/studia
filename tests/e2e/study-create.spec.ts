import { expect, test } from '@playwright/test'
import { createStudyViaWizard, login } from './helpers'

test('login → criar Study pelo wizard → iniciar o timer no detalhe', async ({ page }) => {
  // The mock keeps state in memory for the whole run: a unique title keeps the test independent.
  const title = `Inglês para viagem ${Date.now()}`
  await login(page)
  await createStudyViaWizard(page, title)

  await page.getByRole('link', { name: title }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await page.getByRole('button', { name: 'Iniciar timer' }).click()
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible()
  await expect(page.getByText('Iniciado').first()).toBeVisible()
})
