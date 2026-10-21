# Authentication (frontend)

## Objetivo

Aplicar a ADR-0006 no client: bootstrap de sessão, login/logout e integração com `shared/http`.

## Escopo

`features/auth`, `app/bootstrap`, guards de router (consumo de estado).

## Fora do escopo

- OpenAPI definitivo (`docs/api/`).
- UI de dispositivos / revogação multi-sessão.
- Implementação Spring Security.

## Onde vive

```text
src/features/auth/     # store de sessão, services auth, can/limits (ADR-0004)
src/app/bootstrap/     # initSession antes dos guards
src/shared/http/       # Bearer + single-flight refresh (ADR-0005)
```

## Regras

1. Access token só em memória; refresh só via cookie HttpOnly.
2. Bootstrap: `UNKNOWN → INITIALIZING → AUTHENTICATED | UNAUTHENTICATED` antes dos guards.
3. Router **não** chama refresh; só consulta sessão.
4. Logout centralizado em `features/auth` (POST logout + limpar client).
5. Após login/refresh, hidratar entitlements/usage com a sessão.
6. TTLs MVP: access ~15 min; refresh sliding ~14 dias (servidor/mock é autoridade).
7. Rotas de visitante (`meta.guestOnly`: login, cadastro, esqueci/redefinir senha) redirecionam para a home quando já há sessão.
8. Endpoints públicos de auth (`/auth/login`, `/auth/register`, `/auth/password/*`, `/auth/refresh`) **nunca** disparam refresh em 401 (`shared/http`).

## Fluxos

### Subida do app

```text
initSession → POST /auth/refresh → AUTHENTICATED | UNAUTHENTICATED
```

### 401 em request autenticada

```text
shared/http → refresh single-flight → retry 1x | limpar sessão
```

### Login

```text
POST /auth/login → access memória + cookie refresh → carregar /me (se necessário) → AUTHENTICATED
```

### Cadastro e recuperação de senha (FEATURE-0004)

```text
POST /auth/register          → mesma sessão do login → AUTHENTICATED → home
POST /auth/password/forgot   → 202 sempre (sem enumeração) → e-mail com link
POST /auth/password/reset    → 204 + revoga todas as sessões e tokens de reset → /login?reset=1
```

## Exemplos

### Correto

- Guard: `if (session.status === 'UNAUTHENTICATED') redirect login`
- Service: `authService.login(body)` via `@/shared/http`

### Incorreto

- Guard que chama `refresh()` diretamente
- Persistir JWT em `localStorage`

## Resultado esperado

Auth previsível para Mock e API real, sem misturar transporte e navegação.

## Referências

- ADR-0006, ADR-0005, ADR-0003, ADR-0004
- `http-client.md`, `state-management.md`
