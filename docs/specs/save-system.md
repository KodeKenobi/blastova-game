# Save System Spec

## Purpose

Persist and restore game progression safely across sessions with schema versioning and compatibility checks.

## Inputs

- Current canonical game state snapshot
- Save slot key
- Optional migration functions for prior schemas

## Outputs

- Serialized save payload
- Load result with validation status
- `saveCompleted`, `loadCompleted`, `loadFailed` events

## Public API

- `save(slotId, snapshot)`
- `load(slotId)`
- `listSlots()`
- `deleteSlot(slotId)`

## Data Model

```js
{
  version: 1,
  createdAt: 0,
  updatedAt: 0,
  run: {
    wave: 5,
    gold: 210,
    lives: 17,
    towers: []
  },
  meta: {
    playTimeSec: 560
  }
}
```

## Validation Rules

- Reject missing required fields.
- Reject unsupported future schema versions unless migration is defined.
- Clamp unsafe numeric values to defined bounds.

## Acceptance Criteria

- Saving and loading round-trips without state corruption.
- Invalid payloads fail gracefully with user-visible feedback.
- Schema migrations are deterministic and tested.

## Test Scenarios

1. Save at wave mid-combat and reload accurately.
2. Attempt load from malformed payload and verify safe failure.
3. Load older schema and verify migration path.