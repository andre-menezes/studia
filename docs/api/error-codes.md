# API error codes

## Objetivo

Mapear `code` estável da API (RFC 9457 + extensão) para chaves i18n no frontend.

## Regras

1. O client usa **somente** `code` para mensagem ao usuário.
2. Chave i18n padrão: `errors.<CODE>` (pt-BR e en).
3. Códigos novos entram nesta tabela **no mesmo PR** que o endpoint/mock.
4. Não reutilizar códigos com semântica diferente.

## Catálogo MVP

| code | HTTP típico | i18n key | Quando |
|---|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | `errors.AUTH_INVALID_CREDENTIALS` | Login inválido |
| `AUTH_UNAUTHORIZED` | 401 | `errors.AUTH_UNAUTHORIZED` | Access inválido/ausente |
| `AUTH_REFRESH_INVALID` | 401 | `errors.AUTH_REFRESH_INVALID` | Refresh cookie inválido/expirado/reusado |
| `AUTH_FORBIDDEN` | 403 | `errors.AUTH_FORBIDDEN` | Autenticado sem permissão |
| `VALIDATION_FAILED` | 422 | `errors.VALIDATION_FAILED` | Body inválido (genérico) |
| `STUDY_NOT_FOUND` | 404 | `errors.STUDY_NOT_FOUND` | Study inexistente |
| `STUDY_CREATE_LIMIT_REACHED` | 403 | `errors.STUDY_CREATE_LIMIT_REACHED` | Cota mensal de criações |
| `STUDY_ACTIVE_LIMIT_REACHED` | 403 | `errors.STUDY_ACTIVE_LIMIT_REACHED` | Limite de Studies STARTED (em andamento) |
| `INTERNAL_ERROR` | 500 | `errors.INTERNAL_ERROR` | Falha inesperada |

## Exemplos

### Correto

```ts
toast.error(t(`errors.${error.code}`, t('errors.INTERNAL_ERROR')))
```

### Incorreto

```ts
toast.error(error.detail)
```

## Referências

- ADR-0005, ADR-0007
- `docs/api/openapi.yaml`
- `docs/architecture/i18n.md`
