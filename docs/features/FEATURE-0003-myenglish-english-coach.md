# FEATURE-0003 — MyEnglish English Coach

- **Status:** Accepted
- **Data:** 2026-09-29

## Objetivo

Oferecer uma experiência **MyEnglish** para desenvolvedores praticarem inglês de entrevistas (comportamental + técnica) com um coach que age como Senior SWE nativo — incluindo feedback de grammar/style no formato de `.cursorrules` e idioms técnicos/corporativos.

## Escopo

- Landing pública brand-first (`/english`) com hero e CTAs para modos de prática.
- Sessão de chat/prática (`/english/practice`) com coach em inglês.
- Modos: `behavioral`, `technical`, `freeform`.
- Feedback estruturado (Original / Correction / Native Alternative) + 1 idiom por resposta quando relevante.
- Coach local/demo (mock) sem dependência de API keys; respostas determinísticas o suficiente para demo.

## Fora do escopo

- Integração com LLM real / billing.
- Persistência de histórico no backend.
- Gate de entitlements (feature pública de demo).
- Alteração do domínio Study / Kanban.

## Comportamento

1. Visitante abre `/english` e vê brand MyEnglish + headline + CTA.
2. Escolhe um modo → navega para `/english/practice?mode=…`.
3. Envia mensagens em inglês (ou mistura); o coach responde em inglês.
4. Cada resposta do coach inclui coaching contextual + bloco de English Improvement Feedback + idiom quando aplicável.
5. Usuário pode trocar de modo sem sair da sessão (reset leve do prompt do coach).

## Regras

1. Coach **sempre** responde em inglês (nunca português como língua do coach).
2. HTTP Studia não é usado; `coachService` é local/mock.
3. Feature em `src/features/english-coach/` com `index.ts` público.
4. Rotas `meta.public: true`.
5. Strings de chrome da UI via i18n (`englishCoach.*`); copy do coach hard-coded em inglês no domínio/serviço.

## UX

- Um composition por viewport; brand-first; tipografia expressiva; fundo atmosférico.
- Sem cards no hero; sem look purple-on-white / cream+terracotta / broadsheet.
- Desktop + mobile; 2–3 motions intencionais.

## Entitlements / limites

- Público (demo). Sem `can`/`limits` neste FEATURE.

## Exemplos

### Correto

- Usuário em `/english/practice?mode=behavioral` recebe pergunta STAR e feedback de phrasing.
- Resposta do coach termina com o bloco **English Improvement Feedback**.

### Incorreto

- Coach respondendo em português.
- Dashboard com stats/schedule no first viewport da landing.

## Resultado esperado

Landing + chat utilizáveis para prática de entrevista; build `bun run build` passa; rota pública acessível sem login.

## Referências

- `.cursorrules` (English Coach Instructions)
- `docs/architecture/project-structure.md`
- `docs/architecture/dependency-rules.md`
