# Step 02 Spec: Path Editor (Waypoints)

## Scope

Implement an in-game waypoint path editor for defining, storing, loading, and applying path layouts deterministically.

Includes:

- Waypoint authoring in world coordinates.
- Preview overlay for working path.
- JSON draft save/load.
- Apply edited path to live scene.

Excludes:

- Full visual path authoring UI in HTML.
- Per-world file write automation.

## Runtime gating

- Controlled by debug flag `DEBUG_FLAGS.pathEditor`.
- Editing allowed only during prep phase.

## Controls

- `F7`: toggle path editor overlay.
- `Shift + Left Click`: add waypoint to draft.
- `Backspace`: remove last waypoint.
- `Delete`: clear draft.
- `Esc`: reset draft from current live path.
- `F8`: save draft JSON to localStorage (`tdPathEditorDraft`) and clipboard when available.
- `F9`: load draft JSON from localStorage.
- `F10`: apply draft to live path.

## Data schema

```json
{
  "version": 1,
  "template": {
    "index": 0,
    "id": "serpentine-north",
    "name": "Serpentine North"
  },
  "updatedAt": 0,
  "points": [
    { "x": 40, "y": 145 },
    { "x": 116, "y": 145 }
  ]
}
```

Points are template-space coordinates (BASE width/height), not board-space pixels.

## Integration points

- Module: `src/systems/path-editor-system.js`
- Scene wiring: `src/game.js`
- Live application updates both `path` and `pathSegments`.

## Acceptance criteria

1. Waypoints can be authored in sequence and previewed visually.
2. Draft can be saved and loaded via JSON without shape loss.
3. Applying draft updates enemy route path deterministically.
4. Existing gameplay loop remains unchanged when flag is disabled.

## Manual smoke test

1. Set `DEBUG_FLAGS.pathEditor = true`.
2. Start prep phase and press `F7` to open editor.
3. Add at least 4 waypoints with `Shift + Left Click`.
4. Save (`F8`), clear (`Delete`), reload (`F9`).
5. Apply (`F10`) and start wave; verify enemies follow edited route.