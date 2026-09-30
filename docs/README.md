# Documentação da Studia

> Esta pasta é a fonte de verdade para humanos e agentes de IA.
> Código sem respaldo aqui deve ser tratado como provisório.

## Hierarquia

```text
Product Requirements (product/)
        ↓
Architecture Decision Records (adr/)
        ↓
Architecture Guidelines (architecture/)
        ↓
Feature / Bug Specifications (features/)
        ↓
Implementation
```

| Pasta | Responsabilidade |
|---|---|
| `product/` | O que o produto precisa (PRD, requisitos) |
| `adr/` | Por que uma decisão arquitetural foi tomada |
| `architecture/` | Como o projeto deve ser desenvolvido (regras aplicáveis) |
| `features/` | Como cada funcionalidade deve funcionar (FEATURE/BUG specs) |
| `api/` | Contratos OpenAPI, códigos de erro |
| `conventions/` | Convenções transversais (docs, git/branches/commits) |
| `guides/` | Guias operacionais (ex.: MyEnglish + Ollama) |

## Como usar esta documentação

1. Antes de implementar, localize a ADR e a guideline relevantes.
2. Antes de criar uma feature, escreva ou atualize a spec em `features/`.
3. Se uma decisão mudar, registre uma nova ADR (não reescreva a antiga em silêncio).
4. Prefira exemplos e anti-exemplos a frases vagas.

## Produto, backlog e convenções

- Visão e backlog: [`product/vision.md`](./product/vision.md), [`architecture/open-decisions.md`](./architecture/open-decisions.md)
- Branches e commits: [`conventions/git-workflow.md`](./conventions/git-workflow.md)
- Histórico da discussão inicial (não normativo): [`archive/`](./archive/)
