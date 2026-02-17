# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Vibe Rider** — OutRun-style pseudo-3D bicycle riding game. Single-file HTML5 Canvas game (`index.html`) using vanilla JavaScript only (no external libraries).

Also contains `claude-code-install-guide/index.html`, a standalone Korean guide for Claude Code installation.

Root-level `app.json` and `eas.json` are legacy Expo/EAS Build configs (not actively used).

## Development

No build tools, test runners, or linters. Open `index.html` directly in a browser to play.

## Game Architecture (`index.html`)

- **Rendering**: Pseudo-3D road via segment-based projection (Z-depth scaling to screen coordinates). `requestAnimationFrame` loop at 60fps.
- **Road model**: Array of `TOTAL_SEGMENTS` segments, each with `curve`, `y` (hill height), and spawned objects. Projection uses `CAM_DEPTH / relativeZ * screenHeight` scaling.
- **Sprites**: All game objects rendered as emoji text on Canvas (🚴 player, 🚌🚖🚗🏍️ obstacles, 🎁 items, sidewalk people).
- **Player physics**: `position` (Z world), `playerX` (-1 to 1 lateral), `speed`, `tilt` (visual lean). Road curvature auto-steers the player.
- **Collision**: Checks obstacles within ±1-2 segments of player position, comparing lateral offset distance.
- **Audio**: Web Audio API oscillator-based sounds (no audio files). `ensureAudio()` initializes on first user interaction.
- **Input**: Keyboard (arrow keys / WASD) + touch (drag direction from touch start point).

## UI Language

All in-game text is **Korean** (한국어).
