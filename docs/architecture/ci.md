# CI (integração contínua)

## Objetivo

Garantir que todo PR para `develop` (e `main`) passe pelas mesmas verificações automáticas antes do merge.

## Escopo

- Workflow GitHub Actions em `.github/workflows/ci.yml`.
- Verificações do frontend: typecheck, testes unitários, build do app e build do Storybook.

## Fora do escopo

- CD (deploy automático de ambientes) — guideline futura quando houver hospedagem definida.
- Versionamento/release do app (tags, changelog) — continua em `open-decisions.md`.
- E2E no CI — entra junto com o primeiro teste em `tests/e2e/` (`testing.md`).

## Regras

1. O workflow roda em `pull_request` e `push` para `develop` e `main`.
2. Etapas, nesta ordem: `bun install --frozen-lockfile` → `bun run typecheck` → `bun run test` → `bun run build` → `bun run build-storybook`.
3. A versão do Bun no CI é a mesma de `packageManager` em `package.json`; ao atualizar uma, atualize a outra.
4. Lockfile desatualizado quebra o CI de propósito (`--frozen-lockfile`): rode `bun install` e commite `bun.lock`.
5. PR com CI vermelho não é mergeado. Teste instável (flaky) é corrigido, nunca desativado (`testing.md`).
6. Secrets não são necessários no CI atual; não adicionar `.env` real ao workflow.

## Proteção de branch (configuração no GitHub)

Configurar em **Settings → Branches** para `develop` e `main`:

- Exigir PR antes do merge.
- Exigir o status check **Typecheck, test and build** verde.
- Bloquear push direto.

## Rodar localmente

```bash
bun run typecheck
bun run test        # vitest run (uma vez)
bun run test:watch  # modo watch durante o desenvolvimento
bun run build
```

## Resultado esperado

Nenhum PR chega à `develop` com erro de tipo, teste quebrado ou build quebrado.

## Referências

- `docs/architecture/testing.md`
- `docs/conventions/git-workflow.md`
- `.github/workflows/ci.yml`
