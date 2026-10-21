# Mock Server local (DX)

Mock HTTP mínimo alinhado ao contrato MVP (`docs/api/` + ADR-0005/0006). Autorizado por [ADR-0008](../../docs/adr/ADR-0008-local-http-mock-stub.md).

> O Mock Server oficial/dedicated permanece fora deste repositório; esta pasta é só stub de desenvolvimento local.

## Subir

Na raiz do projeto:

```bash
bun run mock
```

Por padrão: `http://localhost:3000/api/v1`  
CORS: `http://localhost:5173` (override com `MOCK_CORS_ORIGIN`)

## Usuário seed

| Campo | Valor |
|---|---|
| E-mail | `demo@studia.app` |
| Senha | `studia123` |

Cadastro (`POST /auth/register`) cria usuários em memória; cada usuário só vê os próprios Studies. Tudo zera ao reiniciar o mock.

## Recuperação de senha

O mock não envia e-mail. `POST /auth/password/forgot` imprime o link no console:

```text
RESET LINK: http://localhost:5173/reset-password?token=reset_…
```

Para testes E2E, com `MOCK_DEV_ENDPOINTS=1` (o `playwright.config.ts` já liga), `GET /api/v1/__dev/reset-link?email=…` devolve o último link gerado para o e-mail. Esse endpoint existe **só no mock** e fica desligado no `bun run mock` padrão.

## Notas de contrato (MVP)

- Access token opaco (`access_*`), TTL ~15 min (não é JWT).
- Refresh em cookie HttpOnly `refreshToken`, com rotação no `POST /auth/refresh`.

## Frontend

```bash
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:3000/api/v1
bun run dev
```
