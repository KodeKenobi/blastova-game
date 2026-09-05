# Development Phases

## Phase 1: Gameplay first (placeholder visuals)

Goal: fun loop with minimal visuals.

- Grid-based terrain and path readability.
- Enemy movement and wave progression.
- Tower placement, targeting, projectiles, and damage.
- Gold/lives economy and win/lose state.

Exit criteria:

- A full wave can be played start-to-finish with placeholder squares/circles/sprites.
- Difficulty curve can be tuned with config values only.

## Phase 2: Asset replacement

Goal: replace placeholder visuals one asset class at a time.

- Towers
- Enemies
- Projectiles
- Effects
- Terrain and path tiles

Exit criteria:

- Every placeholder type has a mapped asset fallback strategy.
- Animation timing does not break gameplay timing.

## Phase 3: UI separation and UX

Goal: move HUD and menus to HTML/CSS, keep Phaser focused on world rendering.

- Gold/lives/wave display
- Build and upgrade controls
- Settings and pause

Exit criteria:

- Core game state is readable from UI without duplicating state logic.
- Phaser does not render persistent HUD panels.

## Phase 4: Reusable game systems

Goal: inheritance/composition model for towers and enemies.

- Base tower class + tower specializations
- Base enemy class + enemy specializations
- Data-driven configuration per type/level

Exit criteria:

- New tower/enemy types can be added via data + small behavior extensions.

## Phase 5: Polish and content scale

Goal: make the game feel finished.

- Audio layering and feedback clarity
- Particle and camera feedback
- Save/load and progression structure
- Performance and balancing pass

Exit criteria:

- Stable frame pacing in target environment.
- No blocker bugs across two consecutive complete playthroughs.