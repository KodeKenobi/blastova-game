# Enemy System Spec

## Purpose

Represent enemy lifecycle from spawn to exit/death, including movement, health, traits, and reward payout hooks.

## Inputs

- Spawn requests from wave manager
- Path/waypoint data
- Damage events
- Global modifiers (difficulty, buffs/debuffs)

## Outputs

- Active enemy registry updates
- `enemySpawned`, `enemyDamaged`, `enemyDied`, `enemyEscaped` events
- Economy reward events on death
- Life loss events on escape

## Public API

- `spawnEnemy(type, spawnPoint)`
- `applyDamage(enemyId, payload)`
- `update(dt)`
- `getActiveEnemies()`

## Data Model

Base enemy:

```js
{
  id: "enemy-001",
  type: "goblin",
  hp: 40,
  maxHp: 40,
  speed: 55,
  waypointIndex: 0,
  position: { x: 0, y: 0 },
  armor: 0,
  rewardGold: 5
}
```

## Inheritance/Composition

- `Enemy` base for movement + health contract.
- Specializations provide trait modifiers (armor, regen, resistances, split-on-death).

## Acceptance Criteria

- Enemies follow path deterministically.
- Damage resolution emits one death event and one reward payout.
- Escape handling emits one life-loss event and cleanup.

## Test Scenarios

1. Spawn mixed enemy types and verify path following.
2. Apply rapid multi-hit damage and verify no duplicate death.
3. Enemy reaches endpoint and decrements lives exactly once.