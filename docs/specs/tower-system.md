# Tower System Spec

## Purpose

Manage tower lifecycle: placement, targeting intent, firing cadence, upgrades, and selling.

## Inputs

- Build/upgrade/sell commands
- Economy checks (gold)
- Placement validation (path overlap, collision)
- Target candidates from enemy registry

## Outputs

- Tower entities added/updated/removed
- Projectile spawn requests
- Economy spend/refund events
- UI-facing state snapshots

## Public API

- `canPlaceTower(type, position)`
- `placeTower(type, position)`
- `upgradeTower(towerId, branch)`
- `sellTower(towerId)`
- `update(dt)`
- `getTowerState(towerId)`

## Data Model

Base tower:

```js
{
  id: "tower-001",
  type: "archer",
  level: 1,
  range: 140,
  fireRatePerSec: 1.2,
  damage: 12,
  targetMode: "first",
  cooldownMs: 0,
  position: { x: 0, y: 0 }
}
```

## Inheritance/Composition

- `Tower` base for shared behavior.
- Specializations override attack profile and upgrade branches.
- Favor data-driven stats over hardcoded conditionals.

## Acceptance Criteria

- Placement blocked in invalid zones.
- Cooldown and fire cadence match expected DPS within tolerance.
- Upgrades mutate only intended stats and preserve tower identity.
- Sell removes all related references and timers.

## Test Scenarios

1. Place valid tower, auto-acquire target, fire projectile.
2. Upgrade mid-combat without losing existing target lock.
3. Sell tower while projectile is in flight without runtime errors.