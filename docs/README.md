# Project Documentation

This folder defines a system-first workflow for building and scaling the game.

## Why this exists

- Keep implementation modular instead of prompt-by-prompt changes in one large file.
- Separate gameplay logic from presentation and UI.
- Make every feature pass explicit acceptance criteria before moving on.

## Recommended workflow

1. Start from [phases.md](phases.md).
2. Follow [implementation-order.md](implementation-order.md) step by step.
3. For each step, write or update a spec in [specs](specs).
4. Implement only one spec at a time.
5. Validate with a short playtest checklist before starting the next spec.

## Current architecture references

- [architecture.md](architecture.md)
- [art-direction.md](art-direction.md)
- [wave1-asset-production-plan.md](wave1-asset-production-plan.md)
- [wave1-map-redesign-specification.md](wave1-map-redesign-specification.md)
- [specs/system-template.md](specs/system-template.md)
- [specs/step-01/tilemap-camera-implementation.md](specs/step-01/tilemap-camera-implementation.md)
- [specs/step-02/path-editor-waypoints.md](specs/step-02/path-editor-waypoints.md)

## Definition of done (global)

- No cross-system coupling added without documenting the interface contract.
- Existing systems continue to pass smoke tests after each change.
- UI remains outside Phaser except where explicitly justified.
- New assets are integrated only after gameplay behavior is stable with placeholders.