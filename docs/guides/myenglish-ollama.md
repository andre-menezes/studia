# MyEnglish + Ollama

Local, free English coach brain for `/english` practice.

## Model

**Default:** `qwen2.5:14b` (Qwen 2.5 Instruct via Ollama — strong conversational coaching at ~14B).

```bash
# install Ollama: https://ollama.com/download
ollama serve
ollama pull qwen2.5:14b
```

Optional lighter model if 14B is too heavy for your machine:

```bash
ollama pull qwen2.5:7b
# then set VITE_OLLAMA_MODEL=qwen2.5:7b (or change the Model field in the practice UI)
```

Speech uses the browser **Web Speech API** (no extra Ollama model). If you later add Whisper STT via Ollama, pull that model separately (not required today).

## Run the app

```bash
cp .env.example .env   # optional overrides
bun install
bun run dev
# open http://localhost:5173/english
```

| Variable | Default | Notes |
|---|---|---|
| `VITE_OLLAMA_MODEL` | `qwen2.5:14b` | Configurable; also editable in the practice UI |
| `VITE_OLLAMA_BASE_URL` | empty → `/ollama` in dev | Vite proxies `/ollama` → `http://127.0.0.1:11434` |
| `VITE_OLLAMA_DEMO_MODE` | unset | `true` forces mock coach |

## CORS

- **Dev (`bun run dev`):** use the default proxy (`/ollama`). No CORS setup needed.
- **Preview/production static host hitting Ollama directly:** set origins when starting Ollama, e.g.

```bash
OLLAMA_ORIGINS="http://localhost:4173,http://127.0.0.1:4173" ollama serve
```

Then set `VITE_OLLAMA_BASE_URL=http://localhost:11434`.

## Fallback

If Ollama is down or the model is missing, MyEnglish automatically uses the **mock coach** and shows pull/start instructions. You can also enable **Demo mode** in the practice UI.
