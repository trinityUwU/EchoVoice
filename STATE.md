# EchoVoice — State

**Last updated**: 2026-05-11
**Status**: initial scaffold — not yet tested

## Ce qui est fait
- Architecture Electron + electron-vite complète
- Main process : BrowserWindow always-on-top, IPC transcribe-audio, minimize/close
- Groq client : multipart/form-data → whisper-large-v3-turbo
- Hook useAudioRecorder : zero-loss chunking (new recorder starts before old stops)
- Waveform visualizer : AnalyserNode + Framer Motion bars
- App.tsx : overlay dark, draggable header, mic button avec pulse animation
- Scripts start/stop/restart

## À faire
- Tester l'install et le lancement
- Vérifier que MediaRecorder webm fonctionne dans Electron
- Potentiellement ajouter `--use-fake-ui-for-media-stream` pour le dev sans micro
