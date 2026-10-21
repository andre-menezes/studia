import { expect, test } from '@playwright/test'
import { createStudyViaWizard, signUp } from './helpers'

test('tarefas e notas do Study persistem depois de recarregar (FEATURE-0003)', async ({ page }) => {
  await signUp(page)
  const title = `Workspace ${Date.now()}`
  await createStudyViaWizard(page, title)
  await page.getByText(title).first().click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  const newTask = page.getByRole('textbox', { name: 'Nova tarefa' })
  await newTask.fill('Ler capítulo 1')
  await newTask.press('Enter')
  await expect(page.getByRole('checkbox', { name: 'Ler capítulo 1', exact: true })).toBeVisible()
  await newTask.fill('Fazer exercícios')
  await newTask.press('Enter')
  await expect(page.getByRole('checkbox', { name: 'Fazer exercícios', exact: true })).toBeVisible()

  await page.getByRole('checkbox', { name: 'Ler capítulo 1', exact: true }).check()
  await expect(page.getByTestId('tasks-progress')).toHaveText('1 de 2 tarefas concluídas')

  await page.getByRole('button', { name: 'Mover “Fazer exercícios” para cima' }).click()

  // Esc cancels an inline rename (blur from removing the input must not save it).
  await page.getByRole('button', { name: 'Editar “Fazer exercícios”' }).click()
  const titleInput = page.getByRole('textbox', { name: 'Título da tarefa' })
  await titleInput.fill('Não salvar')
  await titleInput.press('Escape')
  await expect(page.getByRole('checkbox', { name: 'Fazer exercícios', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Nova nota' }).click()
  await page.getByRole('textbox', { name: 'Nota' }).fill('**Importante**: revisar <b>sem HTML</b>')
  await page.getByRole('button', { name: 'Salvar nota' }).click()
  const note = page.getByTestId('study-note')
  await expect(note.locator('strong')).toHaveText('Importante')
  await expect(note).toContainText('<b>sem HTML</b>')

  await page.reload()
  await expect(page.getByTestId('tasks-progress')).toHaveText('1 de 2 tarefas concluídas')
  await expect(page.getByRole('checkbox', { name: 'Ler capítulo 1', exact: true })).toBeChecked()
  await expect(page.getByText('Não salvar')).toHaveCount(0)
  const labels = page.locator('article[aria-labelledby="study-tasks-title"] li label')
  await expect(labels).toHaveText(['Fazer exercícios', 'Ler capítulo 1'])
  await expect(page.getByTestId('study-note').locator('strong')).toHaveText('Importante')
})
