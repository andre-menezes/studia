# Architecture Decision Records (ADR)

## Objetivo

Registrar decisões arquiteturais importantes com contexto suficiente para que um humano ou agente de IA aplique a regra sem reinventar o raciocínio.

## Nomenclatura

```text
ADR-NNNN-<slug>.md
```

Ver `docs/conventions/document-naming.md`.

## Template

```markdown
# ADR-NNNN — Título

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
- **Data:** YYYY-MM-DD
- **Contexto:** conversa / issue / `docs/architecture/open-decisions.md`

## Contexto

Por que esta decisão é necessária agora.

## Decisão

O que foi decidido, de forma normativa.

## Consequências

O que passa a ser mais fácil, mais difícil ou proibido.

## Exemplos

### Correto

...

### Incorreto

...

## Alternativas consideradas

...

## Referências

- links para guidelines, product vision, ADRs relacionadas
```

## Índice

| ADR                                                          | Título                             | Status   |
| ------------------------------------------------------------ | ---------------------------------- | -------- |
| [ADR-0001](./ADR-0001-frontend-architecture.md)              | Frontend architecture              | Accepted |
| [ADR-0002](./ADR-0002-feature-oriented-project-structure.md) | Feature-oriented project structure | Accepted |
| [ADR-0003](./ADR-0003-state-management.md)                   | State management                   | Accepted |
| [ADR-0004](./ADR-0004-entitlements-and-authorization.md)     | Entitlements and authorization     | Accepted |
| [ADR-0005](./ADR-0005-http-client.md)                        | HTTP client                        | Accepted |
| [ADR-0006](./ADR-0006-authentication-strategy.md)            | Authentication strategy            | Accepted |
| [ADR-0007](./ADR-0007-api-contract.md)                       | API contract                       | Accepted |
| [ADR-0008](./ADR-0008-local-http-mock-stub.md)               | Local HTTP mock stub (DX)          | Accepted |
| [ADR-0009](./ADR-0009-monthly-creation-quota-period.md)      | Monthly creation quota period      | Accepted |
| [ADR-0010](./ADR-0010-study-session-recording.md)            | StudySession recording             | Accepted |
| [ADR-0011](./ADR-0011-backend-repository.md)                 | Backend repository and contract    | Accepted |
| [ADR-0012](./ADR-0012-payments-gateway.md)                   | Payments gateway                   | Proposed |
