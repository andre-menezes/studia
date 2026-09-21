# Visão do produto

- **Status:** Accepted (extraído da discussão inicial)
- **Data:** 2026-09-16

## Objetivo

Registrar a visão de produto normativa da Studia, independente do arquivo histórico de discussão.

## Escopo

Premissas de produto e conceitos de domínio de alto nível para o MVP e evolução próxima.

## Fora do escopo

Detalhes de UI final, contratos de API e políticas exatas de token (ver `docs/architecture/open-decisions.md`).

## Premissa

SaaS de **planejamento e organização de estudos**.

O sistema atua como **assistente de planejamento**, não como fiscalização:

- incentivar estudos;
- ajudar na organização e no planejamento;
- facilitar o acompanhamento;
- fornecer ferramentas para executar a rotina planejada.

Princípio: **recomenda e organiza; não controla excessivamente o usuário.**

## Conceito central: Study

Study **não** é uma sessão individual. É o objetivo, plano ou área de estudo (ex.: Aprender Inglês, concurso, certificação).

Composição conceitual inicial:

```text
Study
├── Identidade
├── Objetivo
├── Rotina / Frequência
├── Status
├── Tasks
└── Notes
```

### Status do Study

`CREATED` | `STARTED` | `PAUSED` | `COMPLETED` | `ARCHIVED`

- `CREATED`: cadastrado, ainda não iniciado.
- `STARTED`: em andamento (conta no limite `maxActiveStudies`).

### Criação e edição

- Criação: wizard por etapas (preocupação de apresentação).
- Edição: rápida e localizada (não reobrigar o wizard completo).
- Domínio não conhece `currentStep` / `nextStep`.

### Tasks e Notes

Recursos simples **dentro** do Study no MVP (não domínios autônomos). Podem ser promovidos a features depois.

### Timer e StudySession

- Timer: auxilia; **não limita**. Usuário pode continuar após o tempo planejado.
- `StudySession` (histórico/estatísticas): conceito futuro, **não obrigatório no MVP**.

## Planos (direção)

- `FREE` / `PREMIUM`
- Free (exemplos): máx. 3 Studies STARTED; máx. 10 criações/mês
- Limite mensal = criações no período (não devolvidas ao arquivar/excluir)
- Detalhe de entitlements: ADR-0004

## Dashboard

Híbrido, mas prioriza: **o que estou estudando e o que posso fazer agora?** (orientação à ação).

## UX (premissas)

- Navegação contextual (evitar sidebar global obrigatória).
- Mostrar primeiro o que o usuário precisa; revelar ações secundárias no contexto.
- Exclusão de Study é destrutiva (Tasks/Notes acompanham — confirmar na API).

## Resultado esperado

Qualquer FEATURE/BUG parte desta visão sem releitura do arquivo histórico de discussão.

## Referências

- ADR-0001 … ADR-0006
- FEATURE-0001 (wizard de criação de Study)
- `docs/architecture/open-decisions.md`
