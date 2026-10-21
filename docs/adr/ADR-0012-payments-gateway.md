# ADR-0012 — Gateway de pagamento do Premium

- **Status:** Proposed
- **Data:** 2026-10-21
- **Contexto:** roadmap de continuidade (decisão D6, Fase 3)

## Contexto

O Premium precisa de cobrança recorrente. A recomendação aceita foi: público brasileiro → gateway com **Pix**; caso contrário, Stripe. O produto é pt-BR primeiro (i18n padrão `pt-BR`).

## Decisão (proposta)

1. Público inicial: **Brasil**. Meios: cartão (recorrente) e **Pix**.
2. Gateway: escolher entre Stripe (Pix disponível para contas BR) e um gateway nacional (ex.: Mercado Pago, Asaas), avaliando taxa, recorrência via Pix e emissão de nota.
3. O plano do usuário muda **só via webhook** do gateway no backend; o client nunca altera plano.
4. Entitlements e o período de cota Premium seguem o ciclo de cobrança (ADR-0009 §4).

## Pendências para virar Accepted

- Preço do Premium (mensal/anual).
- Entidade de cobrança (CPF/CNPJ) e emissão de nota.
- Escolha final do gateway.

## Referências

- ADR-0004, ADR-0009
