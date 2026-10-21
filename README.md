# Studia

A **Studia** é uma plataforma web para planejamento e gerenciamento de estudos contínuos. Projetada para estudantes e autodidatas, ajuda a transformar grandes metas de aprendizado em cronogramas práticos, combinando técnicas comprovadas de produtividade com acompanhamento visual de desempenho.

## Documentação

- Visão de produto: [`docs/product/vision.md`](docs/product/vision.md)
- Arquitetura e ADRs: [`docs/`](docs/README.md)
- API (OpenAPI): [`docs/api/`](docs/api/README.md)
- Orientações para agentes de IA: [`AGENTS.md`](AGENTS.md)
- Decisões em aberto: [`docs/architecture/open-decisions.md`](docs/architecture/open-decisions.md)

## App (frontend)

Requer [Bun](https://bun.sh). Para API local use o mock em `tools/mock-server` (ou outro Mock alinhado a `docs/api/`).

```bash
# terminal 1 — API mock
bun run mock

# terminal 2 — frontend
cp .env.example .env
bun install
bun run dev
```

Login seed do mock: `demo@studia.app` / `studia123`

`VITE_API_BASE_URL` deve apontar para o Mock (ex.: `http://localhost:3000/api/v1`).

## Design System (Storybook)

Componentes em `src/shared/ui/` documentados no Storybook:

```bash
bun run storybook
```

Abre em `http://localhost:6006`. Build estático: `bun run build-storybook`.

## Testes e CI

```bash
bun run test        # Vitest (unit/component)
bun run test:e2e    # Playwright (sobe mock + app sozinho)
bun run typecheck
```

Todo PR para `develop` roda typecheck, testes e builds no GitHub Actions — ver [`docs/architecture/ci.md`](docs/architecture/ci.md).
