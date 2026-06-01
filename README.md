# EchoVoice

Une fenêtre flottante qui transcrit ta voix en texte. Tu parles, le texte apparaît. Tu copies, tu colles, tu continues.

Ça reste visible par-dessus toutes tes autres fenêtres. Un raccourci clavier (`Ctrl+Shift+Space`) l'ouvre et la ferme. C'est à peu près tout ce qu'il y a à savoir pour l'utiliser.

La transcription passe par Whisper, le modèle de reconnaissance vocale d'OpenAI, hébergé chez Groq. L'audio est envoyé par tranches de 10 secondes — le texte s'affiche donc toutes les 10 secondes, pas mot par mot.

> **Note :** l'app est conçue pour tourner sur Wayland. Le raccourci clavier global repose sur `evdev` via un daemon Python, ce qui le rend indépendant du compositeur. Sur X11 ça peut fonctionner, mais ce n'est pas l'environnement cible.

---

## Ce qu'il te faut pour démarrer

Une clé API Groq. C'est gratuit, ça prend deux minutes sur [console.groq.com](https://console.groq.com). Tu crées un compte, tu génères une clé, tu la colles dans un fichier `.env` à la racine du projet.

```bash
cp .env.example .env
# Ouvre .env et remplace "your_groq_api_key_here" par ta vraie clé
```

Ensuite :

```bash
bun install
bun run dev
```

Si tu n'as pas Bun : [bun.sh](https://bun.sh).

---

## Lancement en production

```bash
./start.sh    # lance l'app en arrière-plan
./stop.sh     # arrête tout
./restart.sh  # stop + relance
```

---

## Langue de transcription

Français par défaut. Pour changer, modifie la constante `DEFAULT_LANGUAGE` dans `src/main/groq-client.ts`.

---

## Stack

- Electron 31 + electron-vite
- React 18, TypeScript, Tailwind CSS
- Framer Motion
- Groq API — modèle `whisper-large-v3-turbo`
