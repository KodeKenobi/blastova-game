package com.towerdefense.game;

import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Collections;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Defer to the next frame instead of hiding system bars synchronously here.
        // Doing this work inline during onCreate() competes with the OS's own
        // app-open window transition animation and causes visible frame drops
        // (jank) right as the splash hands off to the app, which reads as a
        // "flaky/glitchy" splash. Posting it lets the transition animation
        // finish its own frame first.
        getWindow().getDecorView().post(this::enterImmersiveMode);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enterImmersiveMode();
            applyGestureExclusion();
        }
    }

    private void enterImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller == null) return;

        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
    }

    private void applyGestureExclusion() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return; // API 29+

        View rootView = getWindow().getDecorView();
        rootView.post(() -> {
            int w = rootView.getWidth();
            int h = rootView.getHeight();
            if (w == 0 || h == 0) return;

            // Exclude the full screen so no edge swipe interrupts gameplay
            Rect fullScreen = new Rect(0, 0, w, h);
            rootView.setSystemGestureExclusionRects(
                Collections.singletonList(fullScreen)
            );
        });
    }
}
