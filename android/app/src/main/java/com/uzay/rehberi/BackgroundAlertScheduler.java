package com.uzay.rehberi;

import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

final class BackgroundAlertScheduler {
    static final String PERIODIC_WORK = "skyview-background-alerts-periodic";
    static final String IMMEDIATE_WORK = "skyview-background-alerts-immediate";

    private BackgroundAlertScheduler() {}

    static void update(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(SkyBackgroundPlugin.PREFERENCES, Context.MODE_PRIVATE);
        boolean conditionAlerts = preferences.getBoolean("conditionAlerts", false);
        boolean auroraAlerts = preferences.getBoolean("auroraAlerts", false);
        WorkManager manager = WorkManager.getInstance(context);
        NotificationManager notifications = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (!conditionAlerts) notifications.cancel(BackgroundAlertWorker.CLEAR_SKY_NOTIFICATION_ID);
        if (!auroraAlerts) notifications.cancel(BackgroundAlertWorker.AURORA_NOTIFICATION_ID);

        if (!conditionAlerts && !auroraAlerts) {
            manager.cancelUniqueWork(PERIODIC_WORK);
            manager.cancelUniqueWork(IMMEDIATE_WORK);
            notifications.cancel(BackgroundAlertWorker.CLEAR_SKY_NOTIFICATION_ID);
            notifications.cancel(BackgroundAlertWorker.AURORA_NOTIFICATION_ID);
            return;
        }

        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build();
        PeriodicWorkRequest periodic = new PeriodicWorkRequest.Builder(BackgroundAlertWorker.class, 1, TimeUnit.HOURS)
            .setConstraints(constraints)
            .build();
        manager.enqueueUniquePeriodicWork(PERIODIC_WORK, ExistingPeriodicWorkPolicy.UPDATE, periodic);

        OneTimeWorkRequest immediate = new OneTimeWorkRequest.Builder(BackgroundAlertWorker.class)
            .setConstraints(constraints)
            .build();
        manager.enqueueUniqueWork(IMMEDIATE_WORK, ExistingWorkPolicy.REPLACE, immediate);
    }
}
