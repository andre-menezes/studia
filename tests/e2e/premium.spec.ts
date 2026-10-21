import { expect, test } from '@playwright/test'
import { createStudyViaWizard, signUp } from './helpers'

test('assinar o Premium pelo checkout simulado e cancelar depois (FEATURE-0006)', async ({ page }) => {
  await signUp(page)
  await createStudyViaWizard(page, `Premium ${Date.now()}`)
  await expect(page.getByTestId('study-quota')).toContainText('1 de 10')

  await page.getByRole('button', { name: 'Premium' }).click()
  await expect(page.getByRole('heading', { name: 'Planos' })).toBeVisible()
  await expect(page.getByTestId('premium-price')).toContainText('R$')
  await expect(page.getByTestId('premium-price')).toContainText('50,00/mês')

  await page.getByRole('button', { name: 'Assinar com cartão' }).click()
  await expect(page.getByRole('heading', { name: 'Checkout simulado (mock)' })).toBeVisible()
  await page.getByRole('button', { name: 'Aprovar pagamento' }).click()

  await expect(page.getByTestId('billing-return-result')).toContainText('Você agora é Premium', {
    timeout: 15_000,
  })
  await page.getByRole('button', { name: 'Ir para meus Estudos' }).click()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  // Premium has no creation counter to show.
  await expect(page.getByTestId('study-quota')).toHaveCount(0)

  await page.getByRole('button', { name: 'Premium' }).click()
  await expect(page.getByTestId('subscription-status')).toContainText('Premium ativo no cartão')
  await page.getByRole('button', { name: 'Cancelar assinatura' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar assinatura' }).click()
  await expect(page.getByTestId('subscription-status')).toContainText('Assinatura cancelada')
})

test('pagamento recusado no checkout mantém o plano Free', async ({ page }) => {
  await signUp(page)
  await page.getByRole('button', { name: 'Premium' }).click()
  await page.getByRole('button', { name: 'Pagar com Pix (30 dias)' }).click()
  await page.getByRole('button', { name: 'Recusar pagamento' }).click()

  await expect(page.getByTestId('billing-return-result')).toContainText('não foi aprovado')
  await page.getByRole('button', { name: 'Ver planos' }).click()
  await expect(page.getByRole('button', { name: 'Assinar com cartão' })).toBeVisible()
})
