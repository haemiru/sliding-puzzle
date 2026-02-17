# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sliding Puzzle — a browser-based image puzzle game built with React, Vite, and Tailwind CSS v4. Uses Gemini API to generate puppy images that are split into sliding puzzle tiles.

## Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

## Architecture

```
src/
├── main.jsx                    # Entry point, renders App into #root
├── index.css                   # Tailwind CSS import + custom @keyframes + @utility animations
├── App.jsx                     # Root component: all game state, logic, Gemini API orchestration
├── services/
│   └── geminiApi.js            # Gemini 2.0 Flash image generation with retry logic
└── components/
    ├── PuzzleGrid.jsx          # NxN CSS grid with image background-position per tile
    ├── GameControls.jsx        # Buttons: 새 게임, 힌트 (hover/click), 리셋
    ├── GameStats.jsx           # Move count + MM:SS timer
    ├── WinModal.jsx            # Completion modal with stats + completed image preview
    └── HintOverlay.jsx         # Full-screen overlay showing original image
```

### State & Data Flow

- **All state lives in App.jsx** and flows down as props. No context or external state library.
- **Tile model**: `{ id, currentPosition, correctPosition }` — `id: 0` is the empty space.
- **Image flow**: Gemini API returns base64 data URL → stored in `puzzleImage` state → each tile uses `background-image` + `background-size: N00%` + computed `background-position` to show its slice.
- **Shuffle algorithm**: starts from solved state, performs 200-300 random valid moves, prevents reverse moves (`prevEmptyPos` filter) to guarantee solvability.

### Key Patterns

- **Tailwind v4**: `@tailwindcss/vite` plugin, no config file. Custom animations registered via `@utility` directives in `index.css`.
- **Performance**: PuzzleGrid, GameControls, GameStats, WinModal, HintOverlay all wrapped in `React.memo()`. Event handlers use `useCallback()`.
- **Hint**: desktop = `onMouseEnter`/`onMouseLeave` on button, mobile = `onClick` toggle, both show `HintOverlay`. Escape key closes it.
- **Styling**: blue-500 primary, gray-100 page bg, white card `rounded-2xl shadow-lg`. Responsive: 92% width mobile, `max-w-2xl` tablet, `max-w-4xl` desktop.
