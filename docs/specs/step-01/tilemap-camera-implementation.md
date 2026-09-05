# Step 01 Spec: Tile Map and Camera

## Scope

Implement the first production-ready foundation for map readability and camera control.

Includes:

- Render distinct terrain and path zones.
- Camera bounds constrained to world size.
- Keyboard pan and zoom controls.
- Pointer-assisted camera drag and zoom.

Excludes:

- Enemy movement logic.
- Tower placement logic.
- Wave logic.

## World assumptions

- World size uses existing board dimensions.
- Current terrain/path rendering remains source of visual truth.
- Camera system is independent and reusable by future scenes.

## Camera controls

- Pan: `W/A/S/D` and arrow keys.
- Zoom: mouse wheel, `Q` to zoom out, `E` to zoom in.
- Drag pan: hold right mouse button and drag.
- Reset view: `C`.
- Optional debug tools (behind debug flags): `F6` toggles telemetry/checklist overlays.

## Module contract

Primary module: `src/systems/map-camera-system.js`

Public API:

- `createMapCameraSystem(scene, options)`
- `update(dtMs)`
- `destroy()`
- `centerOnWorld()`
- `getSnapshot()`

## Integration points

- Scene create lifecycle initializes system after camera creation.
- Scene update lifecycle forwards frame delta to system update.
- Scene shutdown destroys system listeners.

## Acceptance criteria

1. Camera never reveals outside-world empty space.
2. Pan speed is stable across frame rates.
3. Zoom remains clamped to defined min/max values.
4. Existing gameplay interactions remain functional.
5. Reset returns camera to center at zoom `1`.

## Manual smoke test

1. Launch game and confirm world starts centered.
2. Pan in all directions and confirm bounds clamp.
3. Zoom in/out repeatedly and verify no camera drift outside map.
4. Use right-drag pan while combat objects are active.
5. Place/move towers to verify no input regression.

## Notes for Step 02

- Path editor should reuse camera world coordinates from this system.
- Waypoint tooling should not mutate camera behavior directly.