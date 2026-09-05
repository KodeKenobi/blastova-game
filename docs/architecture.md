# Architecture

## Core principle

Phaser renders and simulates the world.
HTML/CSS renders the HUD and menus.

## Runtime boundaries

### Phaser world domain

Owns:

- Map, path, camera, towers, enemies, projectiles, particles
- Collision and combat simulation
- Tick-based wave progression

Does not own:

- Persistent HUD panels
- Inventory/settings layout and interaction chrome

### UI domain (HTML/CSS/JS)

Owns:

- Gold/lives/wave labels
- Build buttons and upgrade panels
- Pause/settings overlays

Does not own:

- Movement/combat authority
- Economy truth source

## Data flow

1. World state updates in Phaser systems.
2. A shared state adapter emits snapshots/events.
3. UI layer subscribes and re-renders declaratively.
4. UI actions dispatch intents (build, upgrade, sell, pause) to a command gateway.
5. Command gateway validates and forwards to world systems.

## Suggested module map

- `src/game.js` or scene bootstrap: scene setup and wiring only.
- `src/systems/*`: simulation systems (wave, movement, targeting, combat, economy).
- `src/entities/*`: base and specialized entities.
- `src/ui/*`: DOM controllers and view rendering.
- `src/state/*`: shared game state and event bus.

## Stability rules

- No direct DOM manipulation inside world systems.
- No direct Phaser object mutation inside UI modules.
- Cross-boundary communication only through typed events/intents.
- Every system exposes a minimal public API and keeps internals private.