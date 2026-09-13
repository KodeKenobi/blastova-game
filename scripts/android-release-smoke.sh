#!/bin/sh
set -eu

apk_path=${1:-android-artifacts/app-release.apk}
adb install "$apk_path"
adb shell am start -n com.kodekenobi.blastova/.MainActivity

attempt=0
while [ "$attempt" -lt 180 ]; do
  adb shell uiautomator dump /sdcard/blastova-ui.xml >/dev/null 2>&1 || true
  ui=$(adb shell cat /sdcard/blastova-ui.xml 2>/dev/null || true)
  case "$ui" in
    *"Storm Alley"*|*"Reaper's Gate"*|*"Serpent's Nest"*|*"Thunder Pass"*|*"Final Stand"*)
      echo "Android release smoke test passed: world selection is visible."
      exit 0
      ;;
  esac
  adb shell true >/dev/null
  attempt=$((attempt + 1))
done

adb logcat -d -t 2000
echo "::error::Android release APK did not reach world selection within 180 seconds."
exit 1
