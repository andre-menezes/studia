import { expect, test, type Page } from '@playwright/test'
import { createStudyViaWizard, signUp } from './helpers'

/** Board order of the given titles, top to bottom (all are in the same column here). */
function boardOrder(page: Page, titles: string[]) {
  return page
    .locator('.kanban-card')
    .filter({ hasText: new RegExp(titles.join('|')) })
    .allInnerTexts()
    .then((texts) => texts.map((t) => titles.find((title) => t.includes(title))))
}

test('a ordem dos cards no board persiste depois de recarregar (FEATURE-0005)', async ({ page }) => {
  await signUp(page)
  const stamp = Date.now()
  const first = `Primeiro ${stamp}`
  const second = `Segundo ${stamp}`
  await createStudyViaWizard(page, first)
  await createStudyViaWizard(page, second)

  // Newest goes on top of its column.
  await expect.poll(() => boardOrder(page, [first, second])).toEqual([second, first])

  const firstCard = page.locator('.kanban-card').filter({ hasText: first })
  const secondCard = page.locator('.kanban-card').filter({ hasText: second })
  const saved = page.waitForResponse(
    (res) => res.request().method() === 'PATCH' && res.url().includes('/studies/'),
  )
  await firstCard.dragTo(secondCard, { targetPosition: { x: 20, y: 5 } })
  expect((await saved).status()).toBe(200)
  await expect.poll(() => boardOrder(page, [first, second])).toEqual([first, second])

  await page.reload()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  await expect.poll(() => boardOrder(page, [first, second])).toEqual([first, second])
})
