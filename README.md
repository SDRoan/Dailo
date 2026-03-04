# Dailo

A habit and task tracker. Track habits daily, manage tasks per day, see progress visually, and build long-term consistency.

## Features

- **Daily tracking** – Add habits and check them off each day in a simple grid (7 or 14 day view).
- **Weekly planner** – Tasks per day, overall progress, and completion stats.
- **Reminders** – Per-habit remind, start, and end times with browser notifications.
- **Planned duration & worked time** – Set start/end; see “Worked X” and “(X early)” when you finish before end.
- **Visual progress** – Streak counters, weekly bars, donuts, and overall progress.
- **AI habit coach** – Generate personalized daily focus, if-then suggestions, and fallback plans from your real tracking history.
- **Persistent data** – Everything is stored in your browser (localStorage); no account required.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## AI setup

Use Ollama for a fully local/free AI backend.

1. Install Ollama: https://ollama.com/download
2. Start Ollama server:

```bash
ollama serve
```

3. Pull a model (recommended for deeper coaching quality):

```bash
ollama pull qwen2.5:7b
```

Set environment variables (optional if you use defaults):

```bash
export OLLAMA_BASE_URL="http://127.0.0.1:11434"
export OLLAMA_MODEL="qwen2.5:7b"
```

If your machine is low on RAM/VRAM, use a smaller model:

```bash
ollama pull llama3.2:3b
export OLLAMA_MODEL="llama3.2:3b"
```

Notes:
- The app calls `/api/coach` from the tracker.
- In local dev, Vite serves this API route via middleware.
- In Vercel, `api/coach.js` runs as a serverless function. For deployed usage, `OLLAMA_BASE_URL` must point to a reachable Ollama host (not localhost).

## Build

```bash
npm run build
npm run preview
```

## Tech

- React 18 + Vite
- CSS variables for theming (dark theme by default)
- Serverless API route for AI coaching (`/api/coach`)
