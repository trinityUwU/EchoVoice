# EchoVoice — Arborescence

```
EchoVoice/
├── src/
│   ├── main/
│   │   ├── index.ts              — Electron main process, BrowserWindow, IPC handlers
│   │   └── groq-client.ts        — Appel Groq API Whisper via fetch multipart
│   ├── preload/
│   │   └── index.ts              — contextBridge : expose electronAPI au renderer
│   └── renderer/
│       ├── index.html            — Entry HTML
│       ├── main.tsx              — React root mount
│       ├── App.tsx               — UI principale : overlay, contrôles, transcript
│       ├── env.d.ts              — Types window.electronAPI
│       ├── components/
│       │   └── Waveform.tsx      — Visualiseur barres AnalyserNode + Framer Motion
│       ├── hooks/
│       │   └── useAudioRecorder.ts — Hook MediaRecorder zero-loss chunking
│       └── styles/
│           └── index.css         — Tailwind base + scrollbar custom
├── resources/                    — Assets Electron (icône app etc.)
├── logs/                         — Généré par start.sh, reset à chaque restart
├── electron.vite.config.ts       — Config electron-vite (main + preload + renderer)
├── tsconfig.json                 — Root tsconfig (références node + web)
├── tsconfig.node.json            — Config TS pour main + preload
├── tsconfig.web.json             — Config TS pour renderer React
├── tailwind.config.ts            — Dark mode, couleurs accent/danger
├── postcss.config.js
├── package.json
├── .env.example
├── .gitignore
├── start.sh
├── stop.sh
├── restart.sh
├── README.md
├── STATE.md
├── TODO.md
└── ARBORESCENCE.md
```
