# UI System Spec

## Purpose

Render and control HUD/menu flows in HTML/CSS, driven by shared game state and command intents.

## Inputs

- State snapshots/events: gold, lives, wave, selected tower, game status
- User interactions: build, upgrade, sell, pause, speed controls

## Outputs

- DOM updates
- Command intents to game command gateway
- UX animation triggers

## Public API

- `mount(rootElement)`
- `render(snapshot)`
- `bindActions(actionHandlers)`
- `unmount()`

## Data Model

HUD snapshot:

```js
{
  gold: 120,
  lives: 20,
  wave: { current: 3, total: 20, inProgress: true },
  selectedTowerId: "tower-003",
  gameSpeed: 1,
  paused: false
}
```

## Weapon Details Terms

- AOE means Area of Effect.
- In the Weapon Details panel, AOE describes how wide a weapon can affect enemies around its impact or beam lane, not only the primary target.
- Higher AOE means better crowd control against grouped enemies.
- AOE can be 0 for weapons that are mostly single-target and do not apply splash or lane-width damage.
- Players should read AOE together with Damage and Fire Rate:
  - Damage + Fire Rate explain single-target pressure.
  - AOE explains multi-target pressure.

## Acceptance Criteria

- UI reflects state updates without polling scene internals.
- Input latency remains low during heavy world updates.
- No direct Phaser object references in UI layer.

## Test Scenarios

1. Gold/lives/wave update under active combat.
2. Build button disabled when gold is insufficient.
3. Pause toggle blocks gameplay commands except resume.