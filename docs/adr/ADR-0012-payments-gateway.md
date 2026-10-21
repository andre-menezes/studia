# ADR-0012 — Gateway de pagamento do Premium

- **Status:** Accepted
- **Data:** 2026-10-21
- **Contexto:** roadmap de continuidade (decisão D6, Fase 3); respostas do Andre em 2026-10-21

## Contexto

O Premium precisa de cobrança recorrente para um público brasileiro (produto pt-BR primeiro). As pendências da versão Proposed eram preço, entidade de cobrança e gateway. Foram respondidas: **R$ 50,00**, **pessoa física (CPF)**, **Mercado Pago**.

## Decisão

1. **Preço:** Premium **mensal** a **R$ 50,00**. Plano anual fica fora do MVP.
2. **Entidade de cobrança:** conta Mercado Pago de **pessoa física** (CPF). Sem emissão de nota fiscal no MVP; revisar se o volume justificar formalização (ex.: MEI/CNPJ), o que muda só a conta, não o código.
3. **Gateway:** **Mercado Pago**.
   - **Cartão:** assinatura recorrente mensal (Mercado Pago Assinaturas / *preapproval*).
   - **Pix:** pagamento avulso que libera **30 dias** de Premium; o usuário renova manualmente (sem Pix recorrente no MVP).
   - Checkout **hospedado** pelo Mercado Pago (redirect). O client nunca toca dados de cartão.
4. O plano do usuário muda **só via webhook** do Mercado Pago no backend (assinatura validada). O client nunca altera plano e a página de retorno do checkout **não** é prova de pagamento: ela só relê `/auth/me`.
5. Entitlements e o período de cota Premium seguem o ciclo de cobrança (ADR-0009 §4). O client continua decidindo por `can`/`limits` (ADR-0004), nunca por `plan === 'PREMIUM'`.
6. Contrato e fluxo do client: FEATURE-0006. O backend real fica no repo separado (ADR-0011); aqui existe só o mock.

## Consequências

- Sem PCI no frontend (checkout hospedado).
- Pix avulso exige lembrete de renovação (e-mail do backend) e UI mostrando até quando o Premium vale.
- Trocar de gateway depois afeta só o backend e os endpoints `/billing/*`, que são neutros quanto ao gateway.

## Alternativas consideradas

- **Stripe:** bom para cartão, mas Pix e recorrência no Brasil são menos diretos para conta PF.
- **Asaas:** forte em boleto/Pix e nota, mas pensado para PJ.

## Referências

- ADR-0004, ADR-0009, ADR-0011, FEATURE-0006
