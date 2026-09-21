# UI e componentes (frontend)

## Objetivo

Definir onde vive a UI base, quando criar/usar componentes em `shared/ui`, e critérios mínimos de a11y, tokens e Storybook no MVP.

## Escopo

- Componentes genéricos em `src/shared/ui/` (`App*`)
- Critérios para composables vs components de feature
- Tokens CSS em `src/shared/styles/main.css`
- Ícones (Material Symbols Outlined)
- Storybook como catálogo do design system

## Fora do escopo

- Guideline de layout/navegação/dashboard — ver `docs/architecture/layouts.md` e FEATURE-0002
- SEO avançado / meta tags por rota
- Design tokens em arquivo separado do CSS (pode evoluir depois)
- Form resolver (VeeValidate/Zod wrappers)
- Toast global / fila de notificações

## Onde colocar

```text
src/shared/ui/          # AppButton, AppTextField, AppModal, … (sem domínio Study/Task)
src/shared/styles/      # tokens + resets mínimos
src/features/*/components/  # UI com copy/estrutura da feature
.storybook/             # preview + Vite do Storybook
```

`shared` **não** importa `features` nem `app`. Copy de domínio fica na feature (i18n), não nos `App*`.

## Regras

1. **Interação padrão** usa `AppButton`, `AppTextField`, `AppTextarea`, `AppAlert`, `AppBadge`, `AppEmptyState`, `AppTopBar`, `AppModal` / `AppConfirmDialog`, `AppSpinner`, `AppCard`, `AppStepper` quando couber.
2. **Priorizar ícones** em `AppButton` (`prependIcon` / `appendIcon` / `icon`) com Material Symbols — exceto quando o ícone for decorativo demais ou conflitar com `loading`.
3. **Não** criar `<button>` / `<input>` estilizados ad hoc em features se já existir equivalente em `shared/ui`.
4. Exceção: controles com chrome **custom** (ex.: círculo do `AppStepper`) podem usar `<button>` nativo **dentro** do componente shared — não recriar esse padrão nas features.
5. Novo `App*` só quando houver **≥2** consumidores reais **ou** for peça base do design system documentada no Storybook (bootstrap do DS).
6. Componentes `App*` são **i18n-agnósticos**: strings via props/slots; call site usa `t(...)`.
7. Ícones: apenas **Material Symbols Outlined** (ligature), nunca MDI.
8. Tokens: cores/semântica via classes Tailwind mapeadas aos CSS vars (`accent`, `primary`, `error`, `muted`, `border`, `surface`, …). Não inventar roxo/glow “AI default”.
9. Layout autenticado: **canvas** (`bg-background`) + superfícies flutuantes (`bg-surface/90` + `shadow-card`); `AppTopBar` default `floating` — ver `layouts.md`.
10. Feedback efêmero: `AppAlert` com `type` (`success` | `warning` | `alert` | `error` | `info` | `accent`) — ícone/cor automáticos; preferir `type` a `tone`.
11. Cursor: botões usam `pointer`; desabilitados `not-allowed` (ver `main.css` + `AppButton`).
12. A11y mínima: `type` correto, foco visível (`focus-visible`), `aria-label` em icon-only, `role="dialog"` / `aria-modal` em modais, erros de campo com `aria-invalid` + `aria-describedby`.
13. Tom de produto: assistir/organizar estudos — copy encorajadora no call site; shared não embute mensagens punitivas.
14. Storybook: todo `App*` novo deve ter `*.stories.ts` ao lado do componente.

## Composable vs component (feature)

| Preferir | Quando |
|---|---|
| **Component** (`.vue`) | Markup + estilo + slots; recebe dados via props; emite eventos |
| **Composable** | Estado/orquestração de UI (wizard step, dialog open), sem template |
| **Resource store** | Dados de API (`data/status/error/actions`) — ADR-0003 |

Wizard: `currentStep` / `next` / `back` só em composable de apresentação — nunca em `domain/`.

## Exemplos

### Correto

```vue
<script setup lang="ts">
import { AppButton } from "@/shared/ui";
</script>

<template>
  <AppButton variant="outlined" color="muted" prepend-icon="close" @click="onCancel">
    {{ t("common.cancel") }}
  </AppButton>
  <AppButton append-icon="arrow_forward" :loading="pending" @click="onSubmit">
    {{ t("studies.wizard.submit") }}
  </AppButton>
</template>
```

```vue
<AppBadge :tone="statusTone" variant="outlined" size="sm">
  {{ t(`studies.status.${status}`) }}
</AppBadge>
```

### Incorreto

```vue
<!-- ERRADO: botão ad hoc em feature -->
<button class="rounded-xl bg-accent px-4 py-2 text-on-accent">Criar</button>

<!-- ERRADO: domínio dentro de shared -->
<!-- AppStudyStatusBadge.vue em shared/ui -->

<!-- ERRADO: string fixa no App* -->
<!-- AppEmptyState title="Você ainda não criou Study" hardcoded -->
```

## Resultado esperado

Features consomem `shared/ui` de forma consistente; o Storybook espelha o kit; novas telas não reinventam botão/campo/alerta.

## Referências

- ADR-0001, ADR-0002, `project-structure.md`, `dependency-rules.md`
- `docs/architecture/i18n.md`, `docs/architecture/layouts.md`
- `src/shared/ui/`, `.storybook/`
- `docs/product/vision.md` (tom do produto)
