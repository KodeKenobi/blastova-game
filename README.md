# Tower Defense Game

A cross-platform tower defense game built with **Electron** and **Phaser 3**.

## Links

- **Website (GitHub Pages):** https://kodekenobi.github.io/blastova/index.html
  - Source: `/Users/mac/Desktop/Personal Work/Kode Kenobi Website/kodekenobi.github.io` (folder `blastova/`)
- **Playable Game (Railway):** https://blastova-frontend-production.up.railway.app

## Features

- **Classic Tower Defense Gameplay** - Place towers, defend against waves of enemies
- **Progressive Waves** - Enemies get tougher with each wave
- **Gold & Resources** - Earn gold by defeating enemies, spend on towers
- **Cross-Platform** - Runs on Windows, macOS, and Linux

## Setup

### Install Dependencies

```bash
npm install
```

### Development

Run the game in dev mode with hot reload:

```bash
npm run dev
```

This starts both the Vite dev server and Electron in watch mode.

### Build for Production

Build the web assets:

```bash
npm run build
```

Package as desktop app:

```bash
npm run electron:build
```

## Gameplay

- **Left Click** - Place a tower at cursor (costs 30 gold)
- **Defense** - Towers automatically shoot enemies on the path
- **Waves** - Defeat all enemies to progress to the next wave
- **Game Over** - Lose all 20 lives and it's game over

## Project Structure

```
├── electron/
│   ├── main.js         # Electron main process
│   └── preload.js      # Security preload script
├── src/
│   └── game.js         # Phaser game scene
├── index.html          # Entry HTML
├── vite.config.js      # Vite build config
├── package.json        # Dependencies & scripts
└── README.md
```

## Asset Attribution

- Electricity overlay effect by Jordan Irwin (AntumDeluge), sourced from OpenGameArt:
	https://opengameart.org/content/electricity-overlay-effect
- Files used: `public/assets/effects/electricity.png`, `public/assets/effects/electricity_blue.png`
- License: OGA BY 3.0+ and CC BY 3.0+

## Project Locations

- **Game Source:** `/Users/mac/Desktop/Personal Work/PC/blastova-game`
- **Website Folder:** `/Users/mac/Desktop/Personal Work/Websites/blastova`
- **Web Deploy:** https://blastova-frontend-production.up.railway.app (Railway)

## Next Steps

- Multiplayer command runbook: `docs/multiplayer-commands.md`

- Follow the structured implementation workflow in `docs/README.md`
- Implement systems in sequence using `docs/implementation-order.md`
- Define and maintain system contracts under `docs/specs/`
- Add tower upgrades system
- Implement multiple tower types with different abilities
- Add wave progression UI
- Create level maps
- Add sound effects and music
- Implement save/load system
- Add difficulty settings

Enjoy building! 🎮
# blastova-game
