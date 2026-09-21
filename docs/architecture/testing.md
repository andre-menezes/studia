# Testes (frontend)

## Objetivo

Definir a estratégia mínima de testes do app Vue Studia no MVP: o que testar, onde vive o arquivo e qual cobertura é suficiente sem atrapalhar a entrega.

## Escopo

- Testes unitários (domínio, utils, composables puros, mapeamento de erros).
- Testes de componente (Vue) para `shared/ui` crítico e peças de feature estáveis.
- Testes E2E das jornadas MVP (login + criar Study).
- Convenções de pasta e naming.

## Fora do escopo

- Meta de coverage percentual rígida (ex.: 90%) no MVP.
- Testes de carga / performance.
- Contrato contract-testing formal (Pact) — pode vir depois com OpenAPI.
- Testes do stub `tools/mock-server` além do necessário para E2E local.

## Onde colocar

```text
src/**/*.spec.ts              # unit / component colocalizados
tests/e2e/**/*.spec.ts        # jornadas (Playwright ou equivalente escolhido na implantação)
```

Criar `tests/e2e` só quando o primeiro E2E existir. Preferir runner já alinhado ao Vite/Bun quando for introduzido (Vitest para unit/component).

## Regras

1. **Toda FEATURE** nova deve listar no PR o plano mínimo de testes (unit e/ou component e/ou E2E) — subagente `studia-test-planner` quando útil.
2. Priorizar comportamento de **risco**: auth/refresh, entitlements (`limits`), payload do wizard, mapeamento `errors.<CODE>`.
3. **Não** testar detalhes de CSS/Tailwind; testar estados e acessibilidade básica (roles, disabled, labels) quando crítico.
4. Componentes `App*` estáveis: smoke no Storybook + 1–2 specs dos casos de borda (loading, disabled, erro de campo).
5. Features: preferir testar composable/store/service; view só se houver lógica difícil de extrair.
6. E2E usa Mock/stub (`bun run mock`) ou base URL de teste — **nunca** credenciais reais em fixtures commitadas.
7. Fixtures e seeds de login de DX (`demo@studia.app`) só em docs/README ou env de exemplo — não hardcode senha em vários specs; centralizar helper de teste.
8. Flaky: proibido merge consciente; preferir `getByRole` / textos i18n estáveis a selectors frágeis de classe.

## Pirâmide MVP

| Camada | Quando | Exemplos |
|---|---|---|
| Unit | Sempre que houver regra pura | `limits.canCreateStudy`, `toPayload` do wizard, parse de `ApiError` |
| Component | Input/erro/a11y de shared ou passo crítico | `AppTextField` com `error`, `AppConfirmDialog` confirm/cancel |
| E2E | Jornada feliz MVP | login → home → criar Study → sucesso |

## Exemplos

### Correto

```ts
// useStudyWizard.spec.ts — avança etapa só com campo válido
// studyListStore.spec.ts — createStudy prepend na lista (mock service)
```

```text
tests/e2e/study-create.spec.ts
  given mock up
  login seed
  create study via wizard
  expect success panel
```

### Incorreto

```ts
// snapshot gigante de HTML do wizard inteiro
expect(wrapper.html()).toMatchSnapshot()

// E2E apontando para produção
baseURL: 'https://api.studia.app'
```

## Resultado esperado

Regressões de auth, limites e criação de Study são detectáveis sem depender só de QA manual; docs de FEATURE citam o plano de teste.

## Referências

- `docs/architecture/{ui,layouts,i18n,http-client}.md`
- FEATURE-0001, FEATURE-0002
- ADR-0003, ADR-0004, ADR-0005
- `AGENTS.md` (subagente `studia-test-planner`)
