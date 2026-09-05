# Blastova Game Project - Agents & Reference

## Project Paths

- **Game Repository:** `/Users/mac/Desktop/Personal Work/PC/Project-One-Update`
- **Website Folder:** `/Users/mac/Desktop/Personal Work/Websites/blastova`
- **Live URL:** https://blastova-frontend-production.up.railway.app

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

## Release Artifacts Location

- **macOS:** `dist/Blastova-1.0.0-arm64.dmg` (206 MB)
- **Android:** `release-artifacts/Blastova-1.0.0-release.apk` (87 MB)

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

The website in `/Users/mac/Desktop/Personal Work/Websites/blastova` serves as the landing/distribution point for:
- Download links to DMG/APK releases
- Game documentation
- Patch notes & updates
- Player guides

## Next Actions

- Set up GitHub Actions CI/CD for auto-building releases
- Configure GitHub Releases with DMG/APK files
- Create download landing page on website
- Set up DNS/domain configuration for web deployment
