#!/bin/sh
set -eu

apk_path=${1:-android-artifacts/app-release.apk}
adb install "$apk_path"
adb logcat -c
adb shell am start -n com.kodekenobi.blastova/.MainActivity

attempt=0
while [ "$attempt" -lt 180 ]; do
  if adb logcat -d -s BlastovaStartup:I '*:S' | grep -q 'world-selection-ready'; then
    echo "Android release smoke test passed: world selection is mounted."
    exit 0
  fi
  adb shell true >/dev/null
  attempt=$((attempt + 1))
done

adb logcat -d -t 2000
echo "::error::Android release APK did not mount world selection within 180 seconds."
exit 1
