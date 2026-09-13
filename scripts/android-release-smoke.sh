#!/bin/sh
set -eu

apk_path=${1:-android-artifacts/app-release.apk}
diagnostics_dir=${SMOKE_DIAGNOSTICS_DIR:-}

capture_diagnostics() {
  [ -n "$diagnostics_dir" ] || return 0
  mkdir -p "$diagnostics_dir"
  adb logcat -d -t 4000 > "$diagnostics_dir/android-smoke-logcat.txt" || true
  adb exec-out screencap -p > "$diagnostics_dir/android-smoke-screen.png" || true
  adb shell dumpsys activity activities > "$diagnostics_dir/android-smoke-activities.txt" || true
}

adb install "$apk_path"
adb logcat -c
adb shell settings put secure immersive_mode_confirmations confirmed || true
adb shell am start -n com.kodekenobi.blastova/.MainActivity
adb shell input keyevent KEYCODE_ENTER || true

attempt=0
while [ "$attempt" -lt 90 ]; do
  if adb logcat -d -s BlastovaStartup:I '*:S' | grep -q 'world-selection-ready'; then
    echo "Android release smoke test passed: world selection is mounted."
    exit 0
  fi
  # ADB can briefly reconnect while an emulator or device is under load.
  # Preserve the overall deadline instead of failing the smoke test early.
  adb shell sleep 1 || true
  attempt=$((attempt + 1))
done

capture_diagnostics
adb logcat -d -t 2000
echo "::error::Android release APK did not mount world selection within 90 seconds."
exit 1
