# EchoVoice

Floating always-on-top speech-to-text overlay. Records audio in 10s chunks (zero-loss), transcrit via Groq Whisper large-v3-turbo.

## Setup

```bash
cp .env.example .env
# Ajouter ta GROQ_API_KEY dans .env
bun install
bun run dev
```

## Variables d'environnement

| Variable | Requis | Description |
|---|---|---|
| `GROQ_API_KEY` | Oui | Clé API Groq — https://console.groq.com |

## Stack

- Electron 31 + electron-vite
- React 18 + TypeScript + Tailwind CSS
- Framer Motion
- Groq API (whisper-large-v3-turbo)

## Ports

Pas de port réseau — app desktop uniquement.

## Scripts

```bash
./start.sh    # Lance en background
./stop.sh     # Arrête
./restart.sh  # Stop + Start
```

## Langue par défaut

`fr` — modifiable dans `src/main/groq-client.ts` (constante `DEFAULT_LANGUAGE`).
