package com.uzay.rehberi;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

/**
 * TUR 2 / Faz 6.3 — Zengin ISS bildirimi için AlarmManager zamanlayıcısı.
 *
 * LocalNotifications'ın temel bildirimi yerine, geçiş anında özel grafikli
 * bildirimi yayınlar. Tam zamanlı alarm izni yoksa inexact'a düşer ve bunu
 * çağırana bildirir (sahte kesinlik üretmez).
 */
final class IssPassAlarmScheduler {
    static final String PREFERENCES = "skyview_iss_alarms";
    static final String ACTION_FIRE = "com.uzay.rehberi.ISS_PASS_ALARM";

    private IssPassAlarmScheduler() {}

    static boolean schedule(
        Context context,
        int id,
        long triggerAtMs,
        String kind,
        String title,
        String body,
        String timeLabel,
        float durationSeconds,
        String route,
        boolean preferExact
    ) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        preferences.edit()
            .putString(id + "_kind", kind)
            .putString(id + "_title", title)
            .putString(id + "_body", body)
            .putString(id + "_time", timeLabel)
            .putString(id + "_route", route)
            .putFloat(id + "_duration", durationSeconds)
            .apply();

        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return false;

        Intent intent = new Intent(context, IssPassAlarmReceiver.class)
            .setAction(ACTION_FIRE)
            .putExtra("id", id);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        boolean exactAllowed = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || manager.canScheduleExactAlarms();
        boolean exact = preferExact && exactAllowed;
        if (exact) {
            manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent);
        } else {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent);
        }
        return exact;
    }

    static void cancel(Context context, int id) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, IssPassAlarmReceiver.class).setAction(ACTION_FIRE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        if (manager != null) manager.cancel(pendingIntent);
        pendingIntent.cancel();
        context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .remove(id + "_kind")
            .remove(id + "_title")
            .remove(id + "_body")
            .remove(id + "_time")
            .remove(id + "_route")
            .remove(id + "_duration")
            .apply();
    }
}
