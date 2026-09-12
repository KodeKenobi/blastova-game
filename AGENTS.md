# Blastova Game Project - Agents & Reference

## Project Paths

- **Game Repository:** `/Users/mac/Desktop/Personal Work/PC/blastova-game`
- **Website Folder (source of truth for the live site):** `/Users/mac/Desktop/Personal Work/Kode Kenobi Website/kodekenobi.github.io`
- **Website Scratch Folder (local only, NOT deployed):** `/Users/mac/Desktop/Personal Work/Websites/blastova`
- **Live Website (GitHub Pages):** https://kodekenobi.github.io/blastova/index.html
- **Live Game (Railway):** https://blastova-frontend-production.up.railway.app

> Website changes must be made in the `kodekenobi.github.io` folder under `blastova/`. Edits to `Websites/blastova` do not reach the live site.

## Quick Commands

### Development
```bash
npm run dev                    # Start dev server + Electron
npm run dev:renderer          # Vite dev server only (http://127.0.0.1:5173)
npm run dev:electron          # Electron dev only
```

### Building
```bash
npm run build                 # Vite production build → dist/
npm run electron:build        # Build macOS DMG
npm run electron:build:mac    # Build macOS DMG specifically
npm run electron:build:win    # Build Windows NSIS installer
npm run electron:build:linux  # Build Linux AppImage
```

### Android
```bash
cd android
./gradlew assembleRelease     # Build signed APK
./gradlew assembleDebug       # Build debug APK
```

### Testing & Preview
```bash
npm run start                 # Serve dist/ via Vite
npm run preview:prod-local    # Preview production build locally
```

## Releases

Releases are built by CI only — do not build or upload artifacts by hand. Pushes
to `main` build all platform artifacts and publish the version from
`package.json` as the latest GitHub release. Local `electron-builder` runs on
Apple Silicon produce arm64 binaries, which do not run on ordinary
Windows/Linux machines.

```bash
# 1. bump the version in BOTH files (they must match, CI enforces it)
#    package.json            -> "version"
#    android/app/build.gradle -> versionName
# 2. commit and push main; CI creates the matching vX.Y.Z release
git push origin main
```

`.github/workflows/build-release.yml` then builds macOS, Windows, Linux and
Android on native runners and publishes one GitHub release:

| Platform | Asset |
| --- | --- |
| macOS | `Blastova-mac-arm64.dmg` |
| Windows | `Blastova-win-x64.exe` |
| Linux | `Blastova-linux-x86_64.AppImage` |
| Android | `app-release.apk` (signed, signature verified in CI) |

The website links to `releases/latest/download/<asset>`, so it follows new
releases automatically with no HTML changes.

### Android signing

CI reconstructs the keystore from repository secrets: `ANDROID_KEYSTORE_BASE64`,
`ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

> `android/app/blastova-release.keystore` is untracked and irreplaceable. If it is
> lost, no future update can be published under the same Android app ID. Keep an
> offsite backup of the file and its passwords.

## Key Config Files

- `package.json` — Dependencies, build scripts
- `vite.config.js` — Vite bundler config
- `electron/main.js` — Electron main process
- `capacitor.config.ts` — Mobile (iOS/Android) config
- `tailwind.config.js` — TailwindCSS config
- `src/systems/game-config-constants.js` — Game DEBUG_FLAGS

## Important Debug Flags

Located in: `src/systems/game-config-constants.js`

```javascript
DEBUG_FLAGS = {
  fireTestMode: false,           // Weapon fire test mode
  tower1TestWeaponId: 0,         // Test weapon ID (0 = disabled)
  developerUnlocksMaxed: false,  // All weapons unlocked
  autoStartWave: false,          // Auto-start waves
  // ... other flags
}
```

## Barrel Calibrator System

- **Feature:** Interactive dev tool to calibrate weapon barrel positions
- **Location:** `src/systems/barrel-calibrator-system.js`
- **Access:** Settings → Gameplay → "Calibrate Barrels (Dev)" or press `B`
- **Dev-Only:** Controlled by `isDevModeAvailable()` check
- **Weapons Calibrated:**
  - Rocket MK12 (id: 12)
  - Storm Barrage MK2 (id: 17)

## Capacitor/Mobile

- **Android Keystore:** `android/keystore.properties`
- **iOS Config:** `ios/debug.xcconfig`
- **Build:** Uses Capacitor 8.5.0 + Android Gradle 8.14.3

## Website Structure

The site lives in `/Users/mac/Desktop/Personal Work/Kode Kenobi Website/kodekenobi.github.io` under `blastova/` and is published via GitHub Pages at https://kodekenobi.github.io/blastova/index.html. It serves as the landing/distribution point for:
- Download links to DMG/APK releases
- Game documentation
- Patch notes & updates
- Player guides

## Next Actions

- Set up DNS/domain configuration for web deployment
- Code-sign and notarize the macOS build (currently unsigned)
