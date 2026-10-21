import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('login → criar Study pelo wizard → iniciar o timer no detalhe', async ({ page }) => {
  // The mock keeps state in memory for the whole run: a unique title keeps the test independent.
  const title = `Inglês para viagem ${Date.now()}`
  await login(page)

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
  await page.getByRole('link', { name: title }).click()

  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await page.getByRole('button', { name: 'Iniciar timer' }).click()
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible()
  await expect(page.getByText('Iniciado').first()).toBeVisible()
})
