# ADR-0009 — Período da cota mensal de criações

- **Status:** Accepted
- **Data:** 2026-10-21
- **Contexto:** `docs/architecture/open-decisions.md` item 2; ADR-0004 §6; roadmap de continuidade (decisão D2)

## Contexto

O plano Free limita criações de Study por mês (`maxStudyCreationsPerMonth`, hoje 10). ADR-0004 definiu que o usage vem do servidor como contador (`used`, `limit`, `remaining`), mas não definiu **quando o período começa e termina**, nem em qual fuso. Sem isso, backend, mock e UI podem divergir na virada do mês.

## Decisão

1. **Free:** período = **mês calendário no fuso do usuário**. Começa no dia 1 às 00:00 locais e termina no instante em que começa o mês seguinte.
2. **Fuso do usuário:** campo `timeZone` (IANA, ex.: `America/Sao_Paulo`) no `User`, capturado no cadastro via `Intl.DateTimeFormat().resolvedOptions().timeZone`. Ausente ou inválido → `UTC`.
3. Trocar o fuso só vale a partir do **próximo** período (evita "ganhar" criações mudando o fuso no meio do mês).
4. **Premium:** se houver limite de criação, o período segue o **ciclo de cobrança** da assinatura (ADR-0012). Sem limite, `studyCreationsThisPeriod` continua presente com `limit` = valor do entitlement.
5. Criações **não são devolvidas** ao arquivar (regra já existente em `vision.md`).
6. O contrato expõe o período no usage:

```text
usage.studyCreationsThisPeriod
├── used / limit / remaining
├── periodStart   # ISO 8601, instante de início (UTC)
└── periodEnd     # ISO 8601, instante da renovação (exclusivo)
```

7. O servidor é a autoridade (ADR-0004 §3): o client só exibe `periodEnd` ("renova em 1 de nov.") e nunca calcula o período sozinho.

## Consequências

- UI pode mostrar quando a cota renova sem lógica de data própria.
- Backend precisa de `timeZone` no usuário e de um contador por período (tabela `Usage`).
- Mock deve calcular o mês corrente no fuso do usuário seed.

## Exemplos

### Correto

```ts
t('studies.quota.renewsAt', { date: d(new Date(usage.periodEnd), 'short') })
```

### Incorreto

```ts
// client inferindo período
const renews = new Date(now.getFullYear(), now.getMonth() + 1, 1)
```

## Alternativas consideradas

- **Janela móvel de 30 dias:** mais "justa", mas difícil de explicar na UI e de exibir a data de renovação.
- **Mês calendário em UTC:** simples, mas usuários no Brasil veriam a cota renovar às 21:00 do último dia.

## Referências

- ADR-0004, ADR-0012
- `docs/product/vision.md`
- `docs/api/openapi.yaml` (`Usage`)
