# FEATURE-0006 — Assinatura Premium (checkout Mercado Pago)

- **Status:** Accepted
- **Data:** 2026-10-21
- **Contexto:** ADR-0012 (R$ 50,00/mês, PF, Mercado Pago); roadmap (decisão D6)

## Objetivo

Permitir que um usuário Free assine o Premium e veja o estado da assinatura, sem que o client decida plano ou trate dados de pagamento.

## Escopo

- Tela **Planos** (`/plans`): Free vs Premium, preço R$ 50,00/mês, botões "Assinar com cartão" e "Pagar com Pix (30 dias)".
- Redirect para o checkout hospedado do Mercado Pago.
- Página de retorno (`/billing/return`): relê `/auth/me` até o plano mudar (ou tempo esgotar) e informa o resultado.
- Na home: CTA "Conhecer o Premium" quando um limite Free é atingido (no lugar de só mostrar o erro).
- Estado da assinatura (Premium): válido até / próxima cobrança; cancelar assinatura de cartão.
- OpenAPI + mock + i18n no mesmo PR (ADR-0007).

## Fora do escopo

- Plano anual, cupons, trial.
- Nota fiscal, troca de cartão dentro do app (feito no Mercado Pago).
- Webhook real (backend, ADR-0011).

## API

```text
GET  /billing/subscription                        → 200 Subscription
POST /billing/checkout   { method: CARD | PIX }    → 201 { checkoutUrl }
POST /billing/subscription/cancel                  → 200 Subscription
```

```text
Subscription {
  plan: FREE | PREMIUM
  status: NONE | PENDING | ACTIVE | CANCELED | EXPIRED
  method?: CARD | PIX
  priceCents: 5000, currency: BRL
  currentPeriodEnd?: date-time   # até quando o Premium vale
  cancelAtPeriodEnd: boolean
}
```

- `checkoutUrl` é a URL do Mercado Pago (*init_point*). O client só faz `window.location.assign`.
- `checkout` com Premium vigente (`ACTIVE` ou `CANCELED`) → 409 `BILLING_ALREADY_PREMIUM`, **exceto** renovação Pix (`method: PIX` sobre um Premium pago por Pix), que soma 30 dias ao fim do período.
- Criar um checkout invalida os checkouts abertos anteriores do usuário. `PENDING` é derivado de um checkout aberto (expira em 30 min); não é gravado na assinatura.
- Cartão `ACTIVE` renova sozinho: `currentPeriodEnd` é a próxima cobrança. Só `CANCELED` e Pix expiram (`EXPIRED`).
- `cancel` sem assinatura de cartão ativa → 409 `BILLING_NOTHING_TO_CANCEL`. Cancelar mantém o Premium até `currentPeriodEnd`.
- Mock: `checkoutUrl` aponta para uma página do próprio mock que simula aprovar/recusar e volta para `/billing/return`; a aprovação faz o papel do webhook.

## Comportamento

1. Botões de assinar ficam desabilitados com `status = ACTIVE`; a tela mostra o estado atual.
2. Retorno do checkout: até 10 tentativas de `GET /billing/subscription` (2 s entre elas), comparando com o estado salvo antes do redirect. Sucesso só quando o Premium aparece ou o `currentPeriodEnd` avança (renovação); senão → "Pagamento em processamento", com link para Planos. O polling para ao sair da página.
3. Premium por Pix mostra "válido até {data}" e o botão "Renovar com Pix" nos últimos 7 dias.
4. Cancelar pede confirmação (`AppConfirmDialog`).
5. Erros via `errors.<CODE>`.

## Regras

1. O client **nunca** muda plano nem decide acesso por `plan` (ADR-0004); limites vêm de `entitlements`.
2. HTTP só em `features/billing/services`; estado em `billingStore`.
3. Strings em `billing.*` (pt-BR + en). Preço formatado com `Intl.NumberFormat` em BRL.

## Entitlements do Premium (decidido pelo Andre em 2026-10-21)

- **Sem limite** de Studies iniciados e de criações por mês. O `/auth/me` traz a capability `studies.unlimited` e `limits` com tetos técnicos de uso justo (não exibidos).
- **Estatísticas** (pós-MVP, sobre as StudySessions da ADR-0010) ficam **só no Premium**, via capability `statistics.advanced`.

## Testes

- Unit: store (checkout redireciona, cancelamento, polling do retorno com sucesso e tempo esgotado).
- E2E (mock): Free → Planos → Assinar com cartão → aprovar no mock → retorno → plano Premium e limites novos na home.

## Referências

- ADR-0004, ADR-0009, ADR-0012
