# FEATURE-0003 — MyEnglish English Coach

- **Status:** Accepted
- **Data:** 2026-09-30

## Objetivo

Oferecer uma experiência **MyEnglish** voice-first para desenvolvedores praticarem inglês de entrevistas (comportamental + técnica) com um coach Senior SWE nativo — via **Ollama local** (padrão `qwen2.5:14b`), com feedback de grammar/style no formato de `.cursorrules` e idioms técnicos/corporativos.

## Escopo

- Landing pública brand-first (`/english`) com hero e CTAs para modos de prática.
- Sessão voice-first (`/english/practice`) com microfone grande + TTS; texto secundário.
- Modos: `behavioral`, `technical`, `freeform`.
- Coach brain via Ollama HTTP API (`/api/tags`, `/api/chat`), modelo configurável.
- Fallback mock automático quando Ollama está down / modelo ausente, ou toggle **Demo mode**.
- Feedback estruturado (Original / Correction / Native Alternative) + 1 idiom quando relevante.
- Speech: Web Speech API (SpeechRecognition + speechSynthesis); fallback de texto se indisponível.

## Fora do escopo

- Billing / cloud LLM providers.
- Persistência de histórico no backend Studia.
- Gate de entitlements (feature pública de demo).
- Whisper / STT via Ollama (opcional futuro; documentar pull se adicionado).
- Alteração do domínio Study / Kanban.

## Comportamento

1. Visitante abre `/english` e vê brand MyEnglish + headline + CTA.
2. Escolhe um modo → `/english/practice?mode=…`.
3. Segura/toca o mic → fala em inglês → coach responde por voz (TTS) + transcript leve.
4. Painel de texto mostra só grammar feedback + idiom (não um chat-wall).
5. Banner claro se Ollama unreachable ou model missing (com `ollama pull …`).
6. Demo mode força mock mesmo com Ollama disponível.

## Regras

1. Coach **sempre** responde em inglês.
2. HTTP Studia (`shared/http`) não é usado; Ollama usa client dedicado (`ofetch`) na feature.
3. Em `bun run dev`, base default `/ollama` (proxy Vite → `127.0.0.1:11434`) para evitar CORS.
4. Feature em `src/features/english-coach/` com `index.ts` público.
5. Rotas `meta.public: true`.
6. Chrome UI English-first (`useEnglishCoachCopy`); locales pt-BR mantidos.

## Config

| Env | Default | Meaning |
|---|---|---|
| `VITE_OLLAMA_MODEL` | `qwen2.5:14b` | Modelo Ollama |
| `VITE_OLLAMA_BASE_URL` | (dev: `/ollama`) | Base HTTP do Ollama |
| `VITE_OLLAMA_DEMO_MODE` | unset | Força mock |

Override de modelo também via UI (localStorage `myenglish.ollamaModel`).

## Modelo

- **Default:** `qwen2.5:14b` (família Qwen 2.5 Instruct via Ollama).
- Alternativa menor/rápida se 14B for pesado: `qwen2.5:7b` (`ollama pull qwen2.5:7b`).
- Pull: `ollama pull qwen2.5:14b`

## UX

- Voice UI primaria (mic grande); sem chat-wall.
- Brand MyEnglish preservada; motions no mic (pulse/listen).
- Desktop + mobile.

## Entitlements / limites

- Público (demo). Sem `can`/`limits` neste FEATURE.

## Resultado esperado

Practice voice-first utilizável com Ollama quando disponível; mock fallback; `bun run build` passa.

## Referências

- `.cursorrules`
- `docs/guides/myenglish-ollama.md`
- `docs/architecture/project-structure.md`
- `docs/architecture/dependency-rules.md`
