# Layouts e navegação (frontend)

## Objetivo

Definir o shell de layout do MVP: top bar, conteúdo, breakpoints e navegação contextual — alinhado à visão de produto (sem sidebar global obrigatória).

## Escopo

- App shell autenticado (home Studies, detalhe, wizard).
- Uso de `AppTopBar` e regiões de conteúdo.
- Breakpoints e larguras máximas de leitura.
- Navegação contextual (CTAs no lugar certo).

## Fora do escopo

- Design system visual completo / marketing landing.
- Drawer/sidebar persistente como navegação principal.
- SEO / meta por rota (guideline futura).
- Micro-interações avançadas.

## Premissas (produto)

- Priorizar: **o que estou estudando e o que posso fazer agora?**
- Navegação **contextual**: revelar ações secundárias no contexto; evitar chrome global pesado (`docs/product/vision.md`).

## Estrutura canônica

```text
┌──────────────────────────────────────────┐
│  canvas (bg-background + atmosfera)      │
│                                          │
│   ┌────────────────────────────┐         │
│   │ AppTopBar floating         │  sticky │
│   └────────────────────────────┘         │
│                                          │
│   ┌────────────────────────────┐         │
│   │ painéis de conteúdo        │  gap    │
│   │ (surface + shadow, sem     │         │
│   │  divisórias internas)      │         │
│   └────────────────────────────┘         │
└──────────────────────────────────────────┘
```

- **Público (login):** card centralizado, sem TopBar autenticada.
- **Autenticado:** canvas contínuo; `AppTopBar` **flutuante** (`floating`, sem `border-b` full-bleed) + blocos de conteúdo com `shadow-card` e espaços (`gap`), sem linhas de seção.
- Wizard: TopBar flutuante + um painel único (sem `border-t`/`border-b` entre header/body/footer).

## Regras

1. Usar `AppTopBar` para chrome autenticado — não recriar header ad hoc (`docs/architecture/ui.md`).
2. **Não** introduzir sidebar global no MVP sem FEATURE/ADR.
3. Larguras:
   - Home (board FEATURE-0002): até `max-w-[90rem]`; colunas por status com scroll interno (`h-dvh`, sem scroll da página); mobile com scroll horizontal entre colunas
   - Wizard / formulários focados: `max-w-3xl` (painel full-bleed com padding generoso)
   - Detalhe Study: `max-w-3xl`
4. Espaçamento: home autenticada usa `h-dvh` + padding curto; wizard/detalhe mantêm `py-10` / `sm:py-12` com `px-4` / `sm:px-6`.
5. Fundo: `bg-background` como **quadro/canvas**; superfícies elevadas: `bg-surface/90` + `shadow-card` + `rounded-[20px|24px]` — **evitar** `border-b`/`border-t` como divisória de layout (preferir gap).
6. `AppTopBar` default: `floating` (inset + radius + sombra, sem `border`). Só usar barra full-bleed (`floating=false`) se uma FEATURE exigir.
7. Breakpoints: mobile-first; board: colunas fixas + `overflow-x-auto`; filtros empilham em coluna no mobile.
8. Uma **composição** clara por viewport inicial da rota (não “dashboard de widgets” no hero da home).
9. Rotas: composição em `app/router`; features exportam `routes.ts` (ADR-0002).

## Navegação

| De | Para | Como |
|---|---|---|
| Login | Home | pós-auth |
| Home | Wizard criar | CTA `canCreateStudy` |
| Home | Detalhe | clique no item da lista |
| Wizard sucesso | Home | redirect + `AppAlert` (`?created=`) |
| Detalhe | Home | voltar / brand |
| Qualquer autenticado | Login | logout |

## Exemplos

### Correto

```vue
<main class="relative flex h-dvh flex-col overflow-hidden bg-background">
  <AppTopBar max-width-class="max-w-[90rem]">…</AppTopBar>
  <div class="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col gap-4 px-4">
    <!-- filtros + board de colunas com studia-scrollbar -->
  </div>
</main>
```

### Incorreto

```vue
<!-- sidebar fixa com 8 links no MVP -->
<aside class="fixed w-64">…</aside>

<!-- várias “cards” de marketing na primeira dobra da home autenticada -->
```

## Resultado esperado

Telas autenticadas compartilham o mesmo chrome; FEATURE-0002 e seguintes não reinventam layout.

## Referências

- `docs/product/vision.md`
- `docs/architecture/ui.md`
- FEATURE-0001, FEATURE-0002
- `src/shared/ui/AppTopBar.vue`
