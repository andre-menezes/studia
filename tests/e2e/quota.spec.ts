import { expect, test } from '@playwright/test'
import { createStudyViaWizard, signUp } from './helpers'

test('a cota mensal aparece na home e atualiza depois de criar um Study', async ({ page }) => {
  await signUp(page)
  await createStudyViaWizard(page, `Cota ${Date.now()}`)

  const quota = page.getByTestId('study-quota')
  await expect(quota).toContainText('1 de 10 criações este mês')
  await expect(quota).toContainText('renova em 1 de')

  await page.reload()
  await expect(page.getByTestId('study-quota')).toContainText('1 de 10 criações este mês')
})
