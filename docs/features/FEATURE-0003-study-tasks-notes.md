# FEATURE-0003 — Tasks e Notes dentro do Study

- **Status:** Accepted
- **Data:** 2026-10-21
- **Contexto:** `vision.md` (Tasks e Notes); `open-decisions.md` item 5; roadmap (decisão D1)

## Objetivo

Dar ao Study uma lista simples de tarefas e um espaço de anotações, no detalhe do Study, substituindo o aviso "Tasks e notas deste Estudo chegam em breve".

## Escopo

- **Task:** título, concluída/não concluída, ordem. CRUD + reordenar.
- **Note:** texto em Markdown. CRUD.
- Seções "Tarefas" e "Notas" no detalhe do Study (`StudyDetailView`).
- OpenAPI + mock + i18n no mesmo PR (ADR-0007).

## Fora do escopo

- Datas, prazos, prioridades, etiquetas, subtarefas.
- Tasks/Notes fora de um Study (domínios autônomos).
- Anexos, imagens, colaboração.
- Busca dentro das notas.

## Modelo

```text
Task { id, studyId, title (1–200), done, position, createdAt, completedAt? }
Note { id, studyId, content (1–10000, Markdown), createdAt, updatedAt }
```

## API

```text
GET    /studies/{studyId}/tasks                 → { items } (ordenado por position)
POST   /studies/{studyId}/tasks       { title } → 201 Task (entra no fim)
PATCH  /studies/{studyId}/tasks/{id}  { title?, done?, position? } → Task
DELETE /studies/{studyId}/tasks/{id}            → 204

GET    /studies/{studyId}/notes                 → { items } (mais recente primeiro)
POST   /studies/{studyId}/notes       { content } → 201 Note
PATCH  /studies/{studyId}/notes/{id}  { content } → Note
DELETE /studies/{studyId}/notes/{id}            → 204
```

- `position` em PATCH é o índice 0-based desejado; o servidor reindexa as demais.
- Erros: `TASK_NOT_FOUND`, `NOTE_NOT_FOUND` (404), `STUDY_READ_ONLY` (409, Study `ARCHIVED`), `VALIDATION_FAILED` (422), `TASK_LIMIT_REACHED` / `NOTE_LIMIT_REACHED` (422, teto técnico de 200 tasks e 100 notes por Study).

## Comportamento

1. Detalhe carrega Study, tasks e notes em paralelo; falha em tasks/notes não derruba o detalhe (erro local na seção).
2. Adicionar task: campo inline + Enter; aparece no fim da lista.
3. Marcar como concluída: checkbox com atualização otimista; em erro, reverte e mostra `errors.<CODE>`.
4. Editar título: inline; Esc cancela.
5. Reordenar: botões mover para cima/para baixo (acessível por teclado). Drag-and-drop é opcional.
6. Excluir task: exclusão direta, sem confirmação (é barata de recriar). "Desfazer" fica fora do MVP.
7. Nota: editor `AppTextarea`; renderização Markdown com **HTML desabilitado** (sem HTML cru) e links só `http(s)`.
8. Excluir nota: `AppConfirmDialog` (texto livre pode ser longo).
9. Study `ARCHIVED`: tasks e notes em **somente leitura**.
10. Contador "3 de 5 tarefas concluídas" no cabeçalho da seção.

## Regras

1. HTTP só em `features/studies/services`; estado em store dedicada (`studyWorkspaceStore` ou equivalente), não na view.
2. Tasks/Notes vivem dentro de `features/studies` (não criar `features/tasks`).
3. Strings em `studies.tasks.*` e `studies.notes.*` (pt-BR + en).
4. Nenhuma regra de plano: Tasks/Notes não têm limite de plano no MVP.

## Testes

- Unit: store (add, toggle otimista com rollback, reorder, remove).
- E2E: criar Study → adicionar 2 tasks → concluir uma → criar nota → recarregar e ver persistido.

## Resultado esperado

O usuário organiza o que fazer dentro de cada Study e guarda anotações sem sair do detalhe.

## Referências

- `docs/product/vision.md`, FEATURE-0002, ADR-0003, ADR-0007
