import { expect, test } from '@playwright/test'
import { createStudyViaWizard, signUp } from './helpers'

test('pausar o timer grava o bloco de estudo como StudySession (ADR-0010)', async ({ page }) => {
  await signUp(page)
  const title = `Sessão ${Date.now()}`
  await createStudyViaWizard(page, title)

  await page.getByText(title).first().click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.getByRole('button', { name: 'Iniciar timer' }).click()
  // No duration preset: the clock counts up from 00:00:00.
  await expect(page.getByText(/00:00:0[2-9]/)).toBeVisible({ timeout: 10_000 })

  const recorded = page.waitForResponse(
    (res) => res.request().method() === 'POST' && res.url().endsWith('/sessions'),
  )
  await page.getByRole('button', { name: 'Pausar' }).click()
  const res = await recorded

  expect(res.status()).toBe(201)
  const session = await res.json()
  expect(session.studySeconds).toBeGreaterThanOrEqual(2)
  expect(Date.parse(session.endedAt)).toBeGreaterThan(Date.parse(session.startedAt))
})
