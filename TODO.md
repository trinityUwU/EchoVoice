# EchoVoice — TODO
*Dernière mise à jour : 2026-06-01*

## En cours

- [ ] Tester le lancement complet depuis le lanceur système et valider la transcription end-to-end
- [ ] Vérifier que MediaRecorder webm fonctionne dans Electron sur Wayland

## Backlog

- [ ] Config panel : changer la langue de transcription à chaud
- [ ] Export transcript vers fichier .txt
- [ ] Taille de fenêtre réglable (resizable avec contraintes min/max)
- [ ] Indicateur visuel de la qualité audio (niveau RMS)
- [ ] Hotkey start/stop enregistrement sans cliquer sur l'overlay

## Terminé

- [x] Architecture Electron + electron-vite scaffold
- [x] Groq client Whisper (whisper-large-v3-turbo)
- [x] Hook useAudioRecorder zero-loss chunking (10s)
- [x] Waveform visualizer Framer Motion
- [x] Scripts start/stop/restart
- [x] Création repo GitHub public trinityUwU/EchoVoice
- [x] Fix double-toggle : suppression globalShortcut Electron + debounce daemon
- [x] README revu et humanisé
