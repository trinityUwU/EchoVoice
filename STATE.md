# EchoVoice — State
*Dernière mise à jour : 2026-06-01*

## Résumé de l'état actuel

App fonctionnelle, installée en système via `.desktop` pointant directement sur le repo. Repo GitHub public créé et à jour. Bug double-toggle résolu. README revu et humanisé.

## Ce qui a été fait — session du 2026-06-01

- Création du repo GitHub public `trinityUwU/EchoVoice` + push initial
- Fix `.env.example` : clé Groq réelle remplacée par placeholder avant le push (GitHub push protection avait bloqué)
- Bug double-toggle résolu : `globalShortcut` Electron + `hotkey-daemon.py` evdev tiraient simultanément → suppression du `globalShortcut` dans `src/main/index.ts` + debounce 300ms dans `hotkey-daemon.py`
- README entièrement réécrit : structure accessible aux non-techniques, mention Wayland, clarification chunks 10s, explication clé Groq

## Décisions prises

| Décision | Raison | Date |
|----------|--------|------|
| Supprimer `globalShortcut` Electron | Doublon avec `hotkey-daemon.py` evdev — les deux tiraient en même temps sur le même raccourci | 2026-06-01 |
| Debounce 300ms dans le daemon | Protection secondaire si plusieurs devices clavier détectés simultanément | 2026-06-01 |
| Repo GitHub public | Visibilité projet open source Echo Agency | 2026-06-01 |

## Contexte non-évident

- L'app est installée via `~/.local/share/applications/echovoice.desktop` qui pointe directement sur `echovoice-launch.sh` dans le repo — pas de build/install séparé. Mettre à jour le code = mettre à jour l'installation.
- `echovoice-launch.sh` lance le daemon Python en background puis Electron prod depuis `out/`. Après tout changement dans `src/`, un `bun run build` est nécessaire pour que les modifs soient prises en compte au lancement système.
- Le raccourci clavier repose exclusivement sur `hotkey-daemon.py` (evdev, Wayland-compatible). Le `globalShortcut` Electron a été retiré car il créait un double-toggle.

## Prochaines étapes

1. Tester le premier lancement complet depuis le lanceur système (Super → EchoVoice) et vérifier que la transcription fonctionne end-to-end
2. Vérifier que `MediaRecorder` webm fonctionne correctement dans Electron sur Wayland
3. Backlog : config panel langue à chaud, export .txt, fenêtre resizable

## Points en suspens

- Aucun bloquant connu à ce stade

## Historique

### 2026-05-11 — Scaffold initial
Architecture Electron + electron-vite complète. Main process BrowserWindow always-on-top, IPC transcribe-audio, Groq client Whisper, hook useAudioRecorder zero-loss chunking, Waveform visualizer, scripts start/stop/restart. Non testé à ce stade.
