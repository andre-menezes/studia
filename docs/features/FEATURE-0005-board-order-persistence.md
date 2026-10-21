# FEATURE-0005 — Ordem do board persistida

- **Status:** Accepted
- **Data:** 2026-10-21
- **Contexto:** FEATURE-0002 (reordenação "persistida na sessão do board"); roadmap (decisão D7)

## Objetivo

A ordem dos cards em cada coluna do board deve sobreviver a reload e a outro dispositivo.

## Escopo

- Campo `position` no `Study` (índice 0-based dentro da coluna do seu status).
- `PATCH /studies/{studyId}` aceita `position` (sozinho ou junto com `status`).
- `GET /studies` devolve os itens ordenados por `position` dentro de cada status.

## Regras

1. `position` é o índice **desejado** na coluna de destino; o servidor reindexa os vizinhos (0..n-1, sem buracos).
2. Mudança de status sem `position` → card vai para o **topo** da nova coluna (`position = 0`).
3. Study recém-criado entra em `CREATED` com `position = 0` (igual ao prepend atual da UI).
4. Cards `ARCHIVED` não reordenam (FEATURE-0002); o servidor ignora `position` para `ARCHIVED` e os mantém do mais recente para o mais antigo.
5. UI faz atualização otimista e reverte a ordem em caso de erro.

## Fora do escopo

- Ordem global entre colunas; ordenação por outros critérios (nome, data).

## Testes

- Unit: store aplica reorder otimista e rollback.
- E2E: reordenar dois cards → recarregar → mesma ordem.

## Referências

- FEATURE-0002, ADR-0007
