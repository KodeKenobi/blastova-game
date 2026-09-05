package com.kodekenobi.blastova;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Environment;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.content.Intent;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Collections;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Disable activity animation to prevent splash from resizing/moving.
        overridePendingTransition(0, 0);
        
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().setWindowAnimations(0);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        super.onCreate(savedInstanceState);
        getBridge().getWebView().addJavascriptInterface(new AppUpdateBridge(this), "BlastovaUpdater");
        enterImmersiveMode();
        getWindow().getDecorView().post(this::enterImmersiveMode);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-enforce landscape and immersive during game runtime.
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        enterImmersiveMode();
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

    private static final class AppUpdateBridge {
        private final Context context;
        private long downloadId = -1L;

        AppUpdateBridge(Context context) {
            this.context = context.getApplicationContext();
        }

        @JavascriptInterface
        public String getVersionName() {
            try {
                return context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionName;
            } catch (PackageManager.NameNotFoundException ignored) {
                return "0.0.0";
            }
        }

        @JavascriptInterface
        public void downloadAndInstall(String url) {
            Uri source = Uri.parse(url);
            if (!"https".equalsIgnoreCase(source.getScheme()) || !"github.com".equalsIgnoreCase(source.getHost())) {
                return;
            }

            DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) return;

            DownloadManager.Request request = new DownloadManager.Request(source)
                    .setTitle("Blastova update")
                    .setDescription("Downloading the latest Blastova release")
                    .setMimeType("application/vnd.android.package-archive")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, "blastova-update.apk");
            downloadId = manager.enqueue(request);
            context.registerReceiver(new DownloadReceiver(manager, downloadId), new android.content.IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
        }

        private static final class DownloadReceiver extends BroadcastReceiver {
            private final DownloadManager manager;
            private final long expectedId;

            DownloadReceiver(DownloadManager manager, long expectedId) {
                this.manager = manager;
                this.expectedId = expectedId;
            }

            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) != expectedId) return;
                Uri apk = manager.getUriForDownloadedFile(expectedId);
                if (apk == null) return;
                Intent install = new Intent(Intent.ACTION_VIEW, apk);
                install.setDataAndType(apk, "application/vnd.android.package-archive");
                install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                context.startActivity(install);
                context.unregisterReceiver(this);
            }
        }
    }
}
