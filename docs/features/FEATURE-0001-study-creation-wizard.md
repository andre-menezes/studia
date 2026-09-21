# FEATURE-0001 — Study creation wizard

- **Status:** Ready
- **Data:** 2026-09-16

## Objetivo

Permitir que o usuário autenticado crie um **Study** por um fluxo guiado em etapas (wizard), sem expor um formulário único enorme e sem acoplar o domínio ao conceito de “passo”.

## Escopo

- Fluxo de criação de Study no frontend (feature `studies`).
- Etapas de UI: identidade → objetivo → rotina/frequência → confirmação → persistência.
- Checagens de entitlement/limites na UX antes de concluir.
- Integração via `studyService` → `shared/http` → Mock/API.

## Fora do escopo

- Edição de Study (rápida/localizada — FEATURE-0002).
- Tasks e Notes além do necessário para criar Study “vazio” delas no MVP.
- Timer, StudySession, estatísticas.
- Definição visual final (design tokens, marketing) — apenas comportamento e regras.
- Contrato OpenAPI definitivo (paths podem ser `POST /studies`; detalhe em `docs/api/`).

## Comportamento

1. Usuário autenticado inicia “Criar Study”.
2. Wizard apresenta etapas sequenciais; pode voltar para etapas anteriores **antes** de confirmar.
3. Na etapa de confirmação, o usuário revisa um resumo por campo; cada campo tem uma ação de editar que leva **diretamente** à etapa de origem daquele campo — não apenas um "voltar" sequencial. Ao concluir a edição, o usuário retorna à confirmação com o resumo atualizado (edição direcionada por campo).
4. Ao confirmar, o client envia **um** payload de Study completo (não um “save parcial por step” obrigatório no MVP).
5. Sucesso: após o `POST /studies` responder com sucesso, o wizard exibe uma **etapa/estado de sucesso explícito** — não um redirecionamento imediato — com:
   - CTA primário: ver o Study criado (navega para detalhe/dashboard contextual).
   - CTA secundário: criar outro Study (reinicia o wizard do zero, a partir da etapa "Sobre").
6. Falha (rede, validação, limite): mensagem via i18n a partir de `error.code`; wizard permanece utilizável.

Fluxo conceitual de UI:

```text
Sobre (identidade)
  → Objetivo
  → Rotina / Frequência
  → Confirmação (resumo editável por campo + uso da cota)
  → POST Study
  → Sucesso (ver Study | criar outro)
```

## Regras

1. `currentStep` / `nextStep` / `previousStep` vivem só em composable de UI (ex.: `useStudyWizard`) — **nunca** em `domain/`.
2. O domínio `Study` não conhece wizard, router ou componentes Vue.
3. Componentes não chamam HTTP; `studyService.create` (ou equivalente) usa `@/shared/http`.
4. Validação de campos obrigatórios por etapa na UI; o servidor/mock revalida no `POST`.
5. Status do Study ≠ status de Task ≠ sessão de estudo.
6. Não exigir wizard completo para edições futuras (esta FEATURE não cobre edição).
7. A ação de editar um campo a partir da etapa de confirmação deve navegar **diretamente** à etapa que contém aquele campo (edição direcionada); não é permitido implementar isso apenas como "voltar" genérico que percorre etapas sequencialmente.

### Campos mínimos (MVP)

| Área | Conteúdo mínimo |
|---|---|
| Identidade | Nome/título do Study |
| Objetivo | Descrição curta do que se quer alcançar |
| Rotina | Frequência ou disponibilidade declarada (formato simples acordado com API/mock) |
| Confirmação | Resumo editável por campo (edição direcionada à etapa de origem) + indicador de uso da cota mensal |

Detalhe de schema → `docs/api/` / tipos gerados quando existirem.

## UX

- Uma etapa visível por vez; progresso claro (indicador de steps).
- Indicador de progresso deve exibir as 4 etapas (Sobre, Objetivo, Rotina, Confirmação) com estado visual distinto para concluída / atual / pendente.
- A partir do indicador de progresso, o usuário pode navegar diretamente para qualquer etapa **já concluída**; não é permitido pular para uma etapa futura ainda não alcançada.
- Na etapa de confirmação, cada campo do resumo é editável individualmente (ver "Comportamento" e "Regras"), além de permitir voltar sequencialmente se preferido.
- Na etapa de confirmação, exibir o uso atual da cota mensal de criação (`usage.studyCreationsThisPeriod`: usado/limite) como informação de contexto para o usuário — ver "Entitlements / limites" para o papel exato desse indicador.
- Linguagem de assistente (incentivar/organizar), não punitiva.
- CTA primário: Continuar / Criar Study; secundário: Voltar; cancelar com confirmação se houver dados preenchidos.
- Em bloqueio de entitlement: explicar o limite e CTA de upgrade **sem** checar `plan ===` na feature (usar `can` / `limits`).
- Após o submit bem-sucedido, exibir a etapa de sucesso (ver "Comportamento") com os dois CTAs (ver Study criado / criar outro Study).

## Entitlements / limites

Antes de abrir o wizard ou antes do submit (ambos aceitáveis; preferir **antes do submit** + disable CTA se já souber):

- `limits.canCreateStudy(usage)` (cota mensal de criações — ADR-0004).
- Se aplicável ao ativar já como `ACTIVE`: `limits.canActivateStudy(activeCount)`.

Usage e limites vêm da sessão/servidor — **não** inferir cota mensal só contando Studies locais.

Mutação `POST /studies` é revalidada no backend/mock.

### Indicador de uso na confirmação

A etapa de confirmação exibe `usage.studyCreationsThisPeriod` (usado/limite) como **feedback informativo** de UX, não como gate:

- O gate de permissão continua sendo exclusivamente `limits.canCreateStudy(usage)` (ver acima).
- O indicador de uso não decide se o CTA de confirmar fica habilitado/desabilitado; isso é responsabilidade do `limits.canCreateStudy`.
- Exibir o indicador não substitui a revalidação do servidor/mock no `POST /studies`.

## Exemplos

### Correto

```ts
// composable UI
const { currentStep, next, back, draft } = useStudyWizard()

// submit
await studyService.create(toCreateStudyPayload(draft))
```

```ts
import { limits, useUsage } from '@/features/auth'
if (!limits.canCreateStudy(usage.value)) { /* CTA upgrade i18n */ }
```

### Anti-exemplos

```ts
// domain conhece passo
study.nextStep()

// HTTP no .vue
await ofetch('/studies', { method: 'POST', body })

// autorização por plano
if (user.plan === 'FREE' && studies.length >= 3) { … }
```

## Resultado esperado

Usuário cria um Study de ponta a ponta pelo wizard; código respeita camadas ADR-0001…0006; Mock/API podem evoluir o schema sem reescrever o domínio em torno de `currentStep`.

## Referências

- `docs/product/vision.md`
- ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006
- `docs/architecture/{project-structure,dependency-rules,state-management,http-client,authentication}.md`
