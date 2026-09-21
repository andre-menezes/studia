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
┌─────────────────────────────────────┐
│ AppTopBar (brand + meta + actions)  │  sticky, border-b, surface/blur
├─────────────────────────────────────┤
│                                     │
│   main (max-width, padding)         │  conteúdo da rota
│                                     │
└─────────────────────────────────────┘
```

- **Público (login):** card centralizado, sem TopBar autenticada.
- **Autenticado:** `AppTopBar` + `main` com `max-w-2xl` (home/lista) ou `max-w-lg` (wizard) conforme a view.
- Wizard pode omitir ações extras na TopBar; logout permanece acessível na home.

## Regras

1. Usar `AppTopBar` para chrome autenticado — não recriar header ad hoc (`docs/architecture/ui.md`).
2. **Não** introduzir sidebar global no MVP sem FEATURE/ADR.
3. Larguras:
   - Home / lista: `max-w-2xl`
   - Wizard / formulários focados: `max-w-lg` (ou equivalente já usado)
   - Detalhe Study: preferir `max-w-2xl` alinhado à home
4. Espaçamento vertical de página: `py-8` / `py-10` com `px-4` — manter ritmo consistente.
5. Fundo: `bg-background`; superfícies elevadas: `bg-surface` + `border-border` + `shadow-card` / `rounded-[20px]` quando for painel/card de interação.
6. Breakpoints: mobile-first; TopBar e CTAs devem empilhar sem overflow horizontal; preferir `flex-col` → `sm:flex-row` onde já houver padrão (home).
7. Uma **composição** clara por viewport inicial da rota (não “dashboard de widgets” no hero da home).
8. Rotas: composição em `app/router`; features exportam `routes.ts` (ADR-0002).

## Navegação

| De | Para | Como |
|---|---|---|
| Login | Home | pós-auth |
| Home | Wizard criar | CTA `canCreateStudy` |
| Home | Detalhe | clique no item da lista |
| Wizard sucesso | Detalhe / Home | CTAs FEATURE-0001 |
| Detalhe | Home | voltar / brand |
| Qualquer autenticado | Login | logout |

## Exemplos

### Correto

```vue
<AppTopBar>
  <template #brand>…</template>
  <template #actions>
    <AppButton variant="text" color="muted" @click="logout">…</AppButton>
  </template>
</AppTopBar>
<main class="mx-auto max-w-2xl px-4 py-8">…</main>
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
