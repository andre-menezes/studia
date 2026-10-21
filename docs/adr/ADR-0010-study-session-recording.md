# ADR-0010 — Registro de StudySession desde o MVP

- **Status:** Accepted
- **Data:** 2026-10-21
- **Contexto:** `docs/architecture/open-decisions.md` item 6; `vision.md` (Timer e StudySession); roadmap (decisão D3)

## Contexto

O timer do detalhe (FEATURE-0002) já existe e acumula `totalStudySeconds` via `PATCH /studies/{id}`. Esse total perde o histórico: não dá para saber quando nem quanto se estudou em cada dia. Estatísticas (tempo por semana, sequência de dias) são pós-MVP, mas sem gravar sessões agora o histórico do MVP se perde.

## Decisão

1. **Gravar** cada bloco de estudo como `StudySession` desde o MVP. **Não** há tela de estatísticas no MVP.
2. Um bloco é o intervalo contínuo de estudo entre iniciar/retomar e um *flush* do timer (pausar, concluir o tempo, reiniciar, iniciar descanso ou sair do detalhe). Descanso **nunca** conta.
3. Contrato:

```text
POST /studies/{studyId}/sessions   { clientSessionId, startedAt, endedAt, studySeconds }  → 201 StudySession
GET  /studies/{studyId}/sessions   ?limit=                               → 200 { items }
```

4. O servidor valida `0 < studySeconds ≤ (endedAt − startedAt) + 5s de tolerância` e incrementa `Study.totalStudySeconds`.
5. `totalStudySeconds` passa a ser **somente leitura** para o client (sai de `UpdateStudyRequest`). O total é derivado das sessões.
6. Falha ao gravar: em erro transitório (rede, 5xx, 408, 429) o client mantém o bloco pendente em memória e tenta de novo no próximo flush; blocos rejeitados (422, 404) são descartados para não travar a fila. Os envios são serializados. Perder blocos pendentes ao fechar a aba é aceito no MVP.
7. Timer continua **não limitando** o usuário (`vision.md`); a sessão só registra.
8. Cada bloco leva um `clientSessionId` (UUID gerado no client). O servidor é idempotente por esse id: um retry de um bloco já gravado responde 200 com a sessão existente e não soma de novo.

## Consequências

- Estatísticas futuras não exigem migração de dados.
- Uma requisição a mais por bloco (baixo volume).
- `useStudySessionTimer` passa a informar os limites de relógio (`startedAt`/`endedAt`) de cada bloco; o detalhe troca o `PATCH totalStudySeconds` por `POST sessions`.

## Alternativas consideradas

- **Só total acumulado (status quo):** mais simples, perde histórico.
- **Evento por segundo/minuto (heartbeat):** preciso, mas caro e desnecessário para o MVP.

## Referências

- FEATURE-0002 (timer), ADR-0004, ADR-0007
- `docs/product/vision.md`
