import { randomUUID } from 'node:crypto'
import { APP_URL, PREMIUM_PERIOD_MS, PREMIUM_PRICE_CENTS, PUBLIC_URL } from '../config'
import {
  authenticate,
  db,
  hasOpenCheckout,
  planOf,
  subscriptionOf,
  type BillingMethod,
  type User,
} from '../db'
import { json, problem, readJson, unauthorized, validationFailed, type Handler } from '../http'

const CHECKOUT_PATH = /^\/billing\/mock-checkout\/([^/]+)(?:\/(approve|reject))?$/

function toApi(user: User) {
  const sub = subscriptionOf(user.id)
  const plan = planOf(user)
  return {
    plan,
    status: plan === 'FREE' && hasOpenCheckout(user.id) ? 'PENDING' : sub.status,
    method: sub.method,
    priceCents: PREMIUM_PRICE_CENTS,
    currency: 'BRL',
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/** Stand-in for the Mercado Pago hosted checkout: approving plays the webhook's role. */
function checkoutPage(id: string, method: BillingMethod) {
  const base = `/api/v1/billing/mock-checkout/${encodeURIComponent(id)}`
  const label = method === 'CARD' ? 'Assinatura mensal no cartão' : 'Pix: 30 dias de Premium'
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Checkout simulado</title></head>
<body style="font-family:system-ui;max-width:28rem;margin:4rem auto;padding:0 1rem">
<h1>Checkout simulado (mock)</h1>
<p>${escapeHtml(label)} · R$ 50,00</p>
<form method="post" action="${base}/approve"><button type="submit">Aprovar pagamento</button></form>
<form method="post" action="${base}/reject" style="margin-top:1rem"><button type="submit">Recusar pagamento</button></form>
</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

function backToApp(result: 'approved' | 'rejected') {
  return new Response(null, {
    status: 303,
    headers: { Location: `${APP_URL}/billing/return?result=${result}` },
  })
}

async function checkoutRoutes(req: Request, id: string, action: string | undefined) {
  const checkout = db.checkouts.get(id)
  if (!checkout || !hasOpenCheckout(checkout.userId)) {
    return problem(404, 'NOT_FOUND', 'Checkout not found')
  }
  if (req.method === 'GET' && !action) return checkoutPage(id, checkout.method)
  if (req.method !== 'POST' || !action) return null

  db.checkouts.delete(id)
  if (action === 'reject') return backToApp('rejected')

  const sub = subscriptionOf(checkout.userId)
  const premium = sub.status === 'ACTIVE' || sub.status === 'CANCELED'
  // Only a Pix renewal over a Pix period extends it; anything else starts now.
  const renewingPix = premium && checkout.method === 'PIX' && sub.method === 'PIX'
  if (premium && !renewingPix) return backToApp('approved')
  const from = renewingPix ? Date.parse(sub.currentPeriodEnd!) : Date.now()
  db.subscriptions.set(checkout.userId, {
    status: 'ACTIVE',
    method: checkout.method,
    currentPeriodEnd: new Date(from + PREMIUM_PERIOD_MS).toISOString(),
    cancelAtPeriodEnd: false,
  })
  return backToApp('approved')
}

export const billingRoutes: Handler = async (req, path) => {
  if (!path.startsWith('/billing/')) return null

  const checkoutMatch = path.match(CHECKOUT_PATH)
  if (checkoutMatch) return checkoutRoutes(req, checkoutMatch[1], checkoutMatch[2])

  const user = authenticate(req)
  if (!user) return unauthorized()

  if (req.method === 'GET' && path === '/billing/subscription') return json(toApi(user))

  if (req.method === 'POST' && path === '/billing/checkout') {
    const method = (await readJson<{ method?: unknown }>(req))?.method
    if (method !== 'CARD' && method !== 'PIX') return validationFailed()
    const sub = subscriptionOf(user.id)
    const premium = planOf(user) === 'PREMIUM'
    // While Premium, the only new payment allowed is a Pix renewal of a Pix period.
    if (premium && !(method === 'PIX' && sub.method === 'PIX')) {
      return problem(409, 'BILLING_ALREADY_PREMIUM', 'Already premium')
    }
    // One open checkout per user: two approvals must never stack.
    for (const [id, open] of db.checkouts) if (open.userId === user.id) db.checkouts.delete(id)
    const id = randomUUID()
    db.checkouts.set(id, { userId: user.id, method, createdAt: Date.now() })
    return json({ checkoutUrl: `${PUBLIC_URL}/api/v1/billing/mock-checkout/${id}` }, { status: 201 })
  }

  if (req.method === 'POST' && path === '/billing/subscription/cancel') {
    const sub = subscriptionOf(user.id)
    if (sub.status !== 'ACTIVE' || sub.method !== 'CARD') {
      return problem(409, 'BILLING_NOTHING_TO_CANCEL', 'Nothing to cancel')
    }
    db.subscriptions.set(user.id, { ...sub, status: 'CANCELED', cancelAtPeriodEnd: true })
    return json(toApi(user))
  }

  return null
}
