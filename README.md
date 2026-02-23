# Dailo

A habit and task tracker. Track habits daily, manage tasks per day, see progress visually, and build long-term consistency.

## Features

- **Daily tracking** – Add habits and check them off each day in a simple grid (7 or 14 day view).
- **Weekly planner** – Tasks per day, overall progress, and completion stats.
- **Reminders** – Per-habit remind, start, and end times with browser notifications.
- **Planned duration & worked time** – Set start/end; see “Worked X” and “(X early)” when you finish before end.
- **Visual progress** – Streak counters, weekly bars, donuts, and overall progress.
- **Persistent data** – Everything is stored in your browser (localStorage); no account required.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Tech

- React 18 + Vite
- CSS variables for theming (dark theme by default)
- No backend; 100% client-side
