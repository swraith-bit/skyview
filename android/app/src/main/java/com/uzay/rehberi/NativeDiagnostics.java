package com.uzay.rehberi;

import android.app.ActivityManager;
import android.app.ApplicationExitInfo;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import java.util.List;

final class NativeDiagnostics {
    private static final String PREFERENCES = "skyview_native_diagnostics";
    private static boolean installed;

    private NativeDiagnostics() {}

    static synchronized void install(Context context) {
        if (installed) return;
        installed = true;
        Context applicationContext = context.getApplicationContext();
        SharedPreferences preferences = applicationContext.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            preferences.edit()
                .putLong("lastCrashAt", System.currentTimeMillis())
                .putString("lastCrashType", throwable.getClass().getSimpleName())
                .apply();
            if (previous != null) previous.uncaughtException(thread, throwable);
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            ActivityManager manager = (ActivityManager) applicationContext.getSystemService(Context.ACTIVITY_SERVICE);
            List<ApplicationExitInfo> exits = manager.getHistoricalProcessExitReasons(applicationContext.getPackageName(), 0, 1);
            if (!exits.isEmpty()) {
                ApplicationExitInfo exit = exits.get(0);
                preferences.edit()
                    .putInt("lastExitReason", exit.getReason())
                    .putLong("lastExitAt", exit.getTimestamp())
                    .apply();
            }
        }
    }
}
