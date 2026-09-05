# Implementation Order

Implement in this sequence. Do not start the next item until acceptance criteria pass.

## 1) Tile map and camera

Acceptance:

- Camera can pan/zoom within map bounds.
- Path and buildable areas are visibly distinct.

## 2) Path editor (waypoints)

Acceptance:

- Waypoints can be defined, stored, and loaded.
- Enemy path preview is deterministic.

## 3) Enemy movement

Acceptance:

- Enemies follow waypoints without jitter or path drift.
- Speed scaling works per enemy type.

## 4) Health system

Acceptance:

- Units track max/current HP.
- Damage and death events are emitted once per kill.

## 5) Wave manager

Acceptance:

- Wave composition is data-driven.
- Next wave starts only when rules are satisfied.

## 6) Tower placement

Acceptance:

- Placement validity checks path collision and tower overlap.
- Placement consumes gold and spawns correct tower type.

## 7) Target acquisition

Acceptance:

- Towers acquire targets by configurable strategy (first, nearest, strongest).
- Retargeting behavior is stable when targets die/leave range.

## 8) Projectile system

Acceptance:

- Projectile spawn/update/impact lifecycle is complete.
- Projectile hit resolution is deterministic.

## 9) Damage system

Acceptance:

- Damage types/modifiers are applied consistently.
- Multi-hit and splash behavior are validated by test scenarios.

## 10) Enemy death handling

Acceptance:

- Death cleanup prevents orphan objects and duplicate rewards.
- Death VFX/SFX hooks are event-driven.

## 11) Economy (gold)

Acceptance:

- Spend/earn ledger remains non-negative and auditable.
- Rewards are configurable per enemy/wave.

## 12) Upgrade system

Acceptance:

- Upgrade paths and costs are data-driven.
- Upgrade actions preserve tower identity and targeting state.

## 13) Sell system

Acceptance:

- Refund formula is explicit and configurable.
- Selling fully cleans tower references from all systems.

## 14) Particle system

Acceptance:

- Effects trigger from events (shoot, hit, death, wave start/end).
- Particle budgets stay within frame targets.

## 15) Sound manager

Acceptance:

- SFX/music routing supports volume categories.
- Audio state survives pause/resume and focus changes.

## 16) Save/load

Acceptance:

- Save schema has versioning.
- Load validates schema and safely handles mismatches.

## 17) HTML/CSS HUD

Acceptance:

- HUD reads from shared state, not direct scene inspection.
- Core interactions are available without in-canvas controls.

## 18) UI animations

Acceptance:

- Transitions improve clarity and do not block inputs.
- Timing is consistent across refresh rates.

## 19) Polish pass

Acceptance:

- Camera shake, hit flash, floating damage, glow, and transitions are configurable.
- Regression checklist passes for at least one full session.