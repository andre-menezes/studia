# FEATURE-0002 — Study home, detalhe e edição localizada

- **Status:** Accepted
- **Data:** 2026-09-21

## Objetivo

Evoluir a home de Estudos para um **dashboard orientado à ação** (“o que estou estudando e o que posso fazer agora?”), permitir **ver** um Study e **editar** campos de forma rápida e localizada — sem reabrir o wizard completo (FEATURE-0001).

## Escopo

- Home autenticada (`studies-home`): board por status (colunas com scroll interno), empty state, CTA criar, filtro combo (status + busca por nome), feedback de cota/limite.
- Rota de **detalhe** do Study (`GET /studies/{studyId}`).
- **Edição localizada** de título, objetivo, rotina e status (`PATCH /studies/{studyId}` alinhado a `docs/api/`).
- Navegação a partir do sucesso do wizard (“Ver Estudo”) para o detalhe ou home com destaque.
- UX e entitlements via `can` / `limits` (ADR-0004).
- Status de domínio: `CREATED` (default ao cadastrar) | `STARTED` | `PAUSED` | `COMPLETED` | `ARCHIVED`.
- Botão **Iniciar estudo** (`CREATED` → `STARTED`).

## Fora do escopo

- Tasks e Notes (domínio futuro; detalhe pode reservar espaço “em breve” sem CRUD).
- Timer / StudySession / estatísticas.
- Exclusão definitiva de Study (pode ser FEATURE/BUG posterior; se houver API, confirmar destrutivo).
- Wizard de criação (FEATURE-0001).
- Sidebar global obrigatória (ver `docs/architecture/layouts.md`).
- Mock Server oficial externo.

## Comportamento

1. Usuário autenticado vê a home com Studies existentes (ou empty state + CTA criar).
2. Cada item da lista é acionável → abre o **detalhe** do Study.
3. No detalhe: identidade, objetivo, rotina, status; ações primárias contextuais (editar campo, mudar status, voltar à home).
4. **Editar** abre fluxo localizado (inline / dialog / painel) só para o campo ou grupo escolhido — **não** o wizard de 4 etapas.
5. Ao salvar edição: um request de atualização; sucesso atualiza a UI; falha via `errors.<CODE>` (i18n).
6. Mudança de status para `STARTED` (iniciar) respeita `limits.canActivateStudy` quando aplicável; falha `STUDY_ACTIVE_LIMIT_REACHED`.
7. Deep-link: `?created={id}` destaca o Study na home e exibe `AppAlert` de sucesso (dismissível).

```text
Home (lista / empty)
  → Detalhe Study
       → Editar campo(s) localizado
       → Alterar status
  → Criar Study (FEATURE-0001 wizard)
```

## Regras

1. Domínio `Study` não conhece wizard nem “passo”; edição usa o mesmo modelo de domínio.
2. HTTP só em `studyService` → `@/shared/http`; views/composables não chamam ofetch.
3. Contratos: estender OpenAPI + mock com operação de update (ex.: `PATCH /studies/{studyId}`) **no mesmo PR** de implementação (ADR-0007).
4. Strings via i18n (`studies.*`); status com `studies.status.*`.
5. Componentes de UI base: `AppButton`, `AppTextField`, `AppTextarea`, `AppAlert`, `AppBadge`, `AppConfirmDialog`, `AppTopBar`, etc. (`docs/architecture/ui.md`).
6. Não autorizar por `user.plan === …`.

## UX

- Home: board por status; criar; iniciar (`CREATED`); abrir Study; filtros status + nome.
- Sem scroll na página: scroll só nas colunas (mobile: scroll horizontal entre colunas).
- Detalhe: leitura clara; editar revelado no contexto (não esconder tudo atrás de um único “Editar tudo”).
- Tom assistente (organizar/incentivar), não punitivo.
- Layout: `docs/architecture/layouts.md` (AppTopBar + canvas, sem sidebar obrigatória).
- Loading/empty/error com `AppSpinner` / `AppEmptyState` / `AppAlert`.

## Entitlements / limites

- Criar: `limits.canCreateStudy(usage)` (home CTA + wizard).
- Ativar / iniciar: `limits.canActivateStudy(startedCount)` ao passar status para `STARTED`.
- Mutações revalidadas no backend/mock.

## Exemplos

### Correto

```ts
await studyService.update(id, { title: nextTitle })
await studyService.getById(id)
```

```vue
<AppButton variant="text" @click="editField('objective')">
  {{ t('studies.detail.edit') }}
</AppButton>
```

### Anti-exemplos

```ts
// reabrir wizard completo só para mudar o título
router.push({ name: 'studies-create', query: { edit: id } })

// HTTP no .vue
await ofetch(`/studies/${id}`, { method: 'PATCH', body })

if (user.plan === 'FREE') { /* bloquear ACTIVE */ }
```

## Resultado esperado

Usuário entra, vê o que está estudando, abre um Study, edita um campo sem wizard e volta à home; código respeita camadas e entitlements.

## Referências

- `docs/product/vision.md` (dashboard + edição localizada)
- FEATURE-0001, ADR-0002…0007, ADR-0008
- `docs/architecture/{ui,layouts,i18n,http-client,state-management}.md`
- `docs/api/openapi.yaml`, `docs/api/error-codes.md`
