# Wave Manager Spec

## Purpose

Orchestrate enemy spawning cadence, wave transitions, and completion conditions using data-driven wave definitions.

## Inputs

- Wave configuration list
- Enemy factory callback
- Active enemy count events
- Game state flags (paused, game over)

## Outputs

- Spawn requests with enemy type and spawn point
- `waveStarted`, `waveCleared`, `waveAdvanced` events
- Read model updates: current wave index, remaining spawns, timer to next spawn

## Public API

- `initialize({ waves, enemyFactory, eventBus })`
- `startFirstWave()`
- `startNextWave()`
- `update(dt)`
- `getSnapshot()`

## Data Model

Wave definition:

```js
{
  id: "wave-1",
  entries: [
    { enemyType: "goblin", count: 12, intervalMs: 700 }
  ],
  preDelayMs: 1500,
  postDelayMs: 1000,
  rewardGold: 50
}
```

## Rules

- Spawns occur only while wave is active and game is not paused.
- Wave clears when pending spawn queue is empty and active enemy count is zero.
- Manual skip/fast-forward behavior must be explicit and optional.

## Acceptance Criteria

- Identical wave config produces identical spawn order.
- No duplicate `waveCleared` event.
- Pause/resume preserves correct spawn timers.

## Test Scenarios

1. Standard wave progression across 3 waves.
2. Last spawned enemy dies early, wave still clears exactly once.
3. Pause during pre-delay and mid-wave interval resumes correctly.