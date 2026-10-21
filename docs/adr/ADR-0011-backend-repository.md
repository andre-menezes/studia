# ADR-0011 — Repositório do backend e fonte do contrato

- **Status:** Accepted
- **Data:** 2026-10-21
- **Contexto:** roadmap de continuidade (decisão D5); ADR-0001, ADR-0007, ADR-0008

## Contexto

O backend (Spring Boot 3 + Java 21) ainda não existe. É preciso decidir se ele nasce neste repositório (monorepo) ou em outro, e quem é dono do contrato OpenAPI.

## Decisão

1. Backend em **repositório separado** (sugestão de nome: `studia-api`), com build, CI e deploy próprios.
2. `docs/api/openapi.yaml` **neste** repositório continua sendo a **fonte de verdade** do contrato. Mudança de contrato começa por PR aqui (contrato + mock + front no mesmo PR, ADR-0007).
3. O backend consome o contrato publicado (cópia versionada ou download no CI) e roda **testes de contrato** contra ele; divergência quebra o CI do backend.
4. O stub `tools/mock-server` (ADR-0008) continua neste repositório para DX do front.

## Consequências

- Toolchains independentes (Bun × Gradle/Maven) sem acoplar CIs.
- Exige disciplina: endpoint novo nasce no OpenAPI daqui antes do backend.
- Se um dia o contrato precisar viver no backend (ex.: geração a partir do código), isso exige nova ADR.

## Alternativas consideradas

- **Monorepo:** um PR cobre front + back, mas mistura toolchains e deixa o CI mais lento e complexo para um time de uma pessoa.

## Referências

- ADR-0001, ADR-0007, ADR-0008
- `docs/architecture/overview.md`
