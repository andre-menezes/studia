import { expect, test } from '@playwright/test'
import { MOCK_API_URL, SEED_USER, uniqueEmail } from './helpers'

async function fillSignUp(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Nome' }).fill('Pessoa Nova')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel(/^Senha/).fill('senha-forte-123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
}

test('cadastro leva à home vazia e o novo usuário não vê Studies de outros', async ({
  page,
  request,
}) => {
  // A Study owned by the seed user must stay invisible to the new account.
  const login = await request.post(`${MOCK_API_URL}/auth/login`, { data: SEED_USER })
  const { accessToken } = (await login.json()) as { accessToken: string }
  const created = await request.post(`${MOCK_API_URL}/studies`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { title: 'Study do seed', objective: 'Isolamento', routine: { frequency: 'Seg' } },
  })
  expect(created.status()).toBe(201)

  await fillSignUp(page, uniqueEmail('signup'))
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Monte seu primeiro Estudo' })).toBeVisible()
})

test('cadastro com e-mail já usado mostra o erro traduzido', async ({ page }) => {
  await fillSignUp(page, 'demo@studia.app')
  await expect(page.getByText('Já existe uma conta com esse e-mail.')).toBeVisible()
})

test('validação local impede enviar senha curta', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Nome' }).fill('Pessoa Nova')
  await page.getByLabel('E-mail').fill(uniqueEmail('short'))
  await page.getByLabel(/^Senha/).fill('123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeVisible()
  await expect(page).toHaveURL(/\/signup$/)
})

test('esqueci a senha → link do mock → nova senha → login com a nova senha', async ({
  page,
  request,
}) => {
  const email = uniqueEmail('reset')
  await fillSignUp(page, email)
  await page.getByRole('button', { name: 'Sair' }).click()

  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByRole('heading', { name: 'Esqueci minha senha' })).toBeVisible()
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: 'Enviar link' }).click()
  await expect(page.getByText(/Se houver uma conta com esse e-mail/)).toBeVisible()

  const res = await request.get(`${MOCK_API_URL}/__dev/reset-link`, { params: { email } })
  expect(res.ok()).toBe(true)
  const { link } = (await res.json()) as { link: string }
  await page.goto(new URL(link).pathname + new URL(link).search)

  await page.getByLabel(/^Nova senha/).fill('outra-senha-456')
  await page.getByLabel(/^Confirmar nova senha/).fill('outra-senha-456')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()

  await expect(page.getByText('Senha redefinida. Entre com a nova senha.')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill('outra-senha-456')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
})

test('link de redefinição inválido oferece pedir outro', async ({ page }) => {
  await page.goto('/reset-password?token=reset_invalido')
  await page.getByLabel(/^Nova senha/).fill('outra-senha-456')
  await page.getByLabel(/^Confirmar nova senha/).fill('outra-senha-456')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByText('Este link de redefinição é inválido ou expirou.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Pedir um novo link' })).toBeVisible()
})
