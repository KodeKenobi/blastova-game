# Audio System Spec

## Purpose

Handle playback policy, mixing categories, and event-driven sound cues for combat and UI feedback.

## Inputs

- Audio event stream (shot, hit, death, wave start, UI click)
- User settings (master, music, SFX volumes; mute)
- Runtime focus/pause state

## Outputs

- Sound playback requests
- Music state transitions
- Persisted audio settings

## Public API

- `initialize({ assets, settingsStore })`
- `playSfx(name, options)`
- `playMusic(track, options)`
- `setVolume(category, value)`
- `setMuted(flag)`
- `handleAppFocusChange(focused)`

## Categories

- `master`
- `music`
- `sfx`
- `ui`

## Acceptance Criteria

- Category volume controls are independent and persistent.
- Pause/background handling is predictable in web and Electron runtime.
- Duplicate event bursts are rate-limited where needed.

## Test Scenarios

1. Rapid tower fire does not clip into distortion.
2. Pause/resume preserves music position (if desired policy says resume).
3. Mute/unmute toggles all categories instantly.