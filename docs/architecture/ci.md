# CI (integração contínua)

## Objetivo

Garantir que todo PR para `develop` (e `main`) passe pelas mesmas verificações automáticas antes do merge.

## Escopo

- Workflow GitHub Actions em `.github/workflows/ci.yml`.
- Verificações do frontend: typecheck, lint, testes unitários, E2E, build do app e build do Storybook.

## Fora do escopo

- CD (deploy automático de ambientes) — guideline futura quando houver hospedagem definida.
- Versionamento/release do app (tags, changelog) — continua em `open-decisions.md`.

## Regras

1. O workflow roda em `pull_request` e `push` para `develop` e `main`.
2. Dois jobs em paralelo:
   - **Typecheck, test and build:** `bun install --frozen-lockfile` → `bun run typecheck` → `bun run lint` → `bun run test` → `bun run build` → `bun run build-storybook`.
   - **E2E (Playwright):** `bun install --frozen-lockfile` → `bunx playwright install --with-deps chromium` → `bun run test:e2e`. Em falha, o relatório e os traces ficam como artifact `playwright-report` por 7 dias.
3. A versão do Bun no CI é a mesma de `packageManager` em `package.json`; ao atualizar uma, atualize a outra.
4. Lockfile desatualizado quebra o CI de propósito (`--frozen-lockfile`): rode `bun install` e commite `bun.lock`.
5. PR com CI vermelho não é mergeado. Teste instável (flaky) é corrigido, nunca desativado (`testing.md`).
6. Secrets não são necessários no CI atual; não adicionar `.env` real ao workflow.
7. Lint: `eslint.config.js` usa os presets recomendados de `@eslint/js`, `typescript-eslint` e `eslint-plugin-vue`. Regras só de formatação ficam desligadas até o projeto adotar um formatter (decisão separada). Desligar uma regra exige comentário no config explicando o motivo; `eslint-disable` em linha só com justificativa ao lado.

## Proteção de branch (configuração no GitHub)

Configurar em **Settings → Branches** para `develop` e `main`:

- Exigir PR antes do merge.
- Exigir os status checks **Typecheck, test and build** e **E2E (Playwright)** verdes.
- Bloquear push direto.

## Rodar localmente

```bash
bun run typecheck
bun run lint        # ESLint (flat config em eslint.config.js)
bun run test        # vitest run (uma vez)
bun run test:watch  # modo watch durante o desenvolvimento
bun run test:e2e    # Playwright: sobe mock (3100) e app (5180) sozinho
bun run build
```

## Resultado esperado

Nenhum PR chega à `develop` com erro de tipo, teste quebrado ou build quebrado.

## Referências

- `docs/architecture/testing.md`
- `docs/conventions/git-workflow.md`
- `.github/workflows/ci.yml`
