# HTTP client (frontend)

## Objetivo

Aplicar a ADR-0005 no dia a dia: onde vive o cliente, como services o usam e o que é proibido.

## Escopo

`src/shared/http`, uso a partir de `features/*/services`, integração mínima com sessão (`features/auth`).

## Fora do escopo

- Política de expiração/rotação de tokens (ADR-0006).
- Redação das mensagens i18n (ver `docs/architecture/i18n.md` e `docs/api/error-codes.md`).
- Implementação do stub DX (`tools/mock-server/`, ADR-0008) ou do Mock Server oficial (repositório externo).

## Onde colocar

```text
src/shared/http/
├── client.ts          # instância ofetch + hooks (auth, refresh, erro)
├── errors.ts          # tipo de erro normalizado + helpers
└── index.ts           # API pública (http, tipos de erro)
```

Criar arquivos só quando houver implementação real.

## Regras

1. Toda chamada à API da Studia passa por `@/shared/http`.
2. Apenas **services** de feature (ou bootstrap de sessão em `app`/`features/auth`) usam o cliente — não components, não views, não domain puro.
3. Access token só em memória; refresh só via cookie HttpOnly (`credentials: 'include'`).
4. Em `401`, o cliente faz refresh **single-flight** e **um** retry da request; router não chama refresh.
5. Erros de API → `code` estável → i18n; nunca mensagem crua do backend na UI.
6. Base URL vem de config de app / env, não de string espalhada nas features.

## Forma canônica de service

```ts
import { http } from "@/shared/http";
import type { Study } from "../domain/study";

export function listStudies() {
  return http<Study[]>("/studies");
}

export function createStudy(body: unknown) {
  return http<Study>("/studies", { method: "POST", body });
}
```

Resource stores chamam essas funções (ADR-0003); não reimplementam HTTP.

## Single-flight (comportamento esperado)

```text
várias requests → 401
        ↓
   refresh() único
        ↓
  novo access token
        ↓
  retry das requests (1x)
```

Se o refresh falhar: limpar sessão via auth → falha propagada → guard/UI mandam para login.

## Erros

O cliente deve lançar/retornar erro com:

- `status` (HTTP)
- `code` (string estável, quando o body trouxer)
- payload opcional para debug (não exibir ao usuário)

Mapeamento i18n fica nas features / `shared/i18n` (ex.: `errors.<CODE>`). Catálogo canônico: `docs/api/error-codes.md` (ADR-0007).

## Exemplos

### Correto

- `studyService.list()` → `http('/studies')`
- Bootstrap chama refresh uma vez na subida do app
- Feature mostra `$t('errors.STUDY_CREATE_LIMIT_REACHED')` a partir de `error.code`

### Incorreto

- `ofetch` importado em `StudyListView.vue`
- Segundo `POST /auth/refresh` enquanto o primeiro ainda está pendente
- `localStorage.setItem('accessToken', ...)`
- `toast(error.message)` com texto do servidor
- Usar código inventado (`STUDY_LIMIT_REACHED`) em vez do catálogo (`STUDY_CREATE_LIMIT_REACHED` / `STUDY_ACTIVE_LIMIT_REACHED`)

## Resultado esperado

Qualquer feature nova consome a API só via service + `shared/http`, com auth e erro previsíveis para Mock e API real.

## Referências

- ADR-0005, ADR-0007
- `docs/api/error-codes.md`, `docs/api/openapi.yaml`
- ADR-0003, `docs/architecture/state-management.md`
- ADR-0001, ADR-0008 (`tools/mock-server/` — stub DX; mock oficial externo)
- `docs/architecture/i18n.md`
