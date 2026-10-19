package com.uzay.rehberi;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

/** TUR 2 / Faz 6.3 — ISS geçiş alarmının bildirim alıcısı. */
public class IssPassAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        if (Build.VERSION.SDK_INT >= 33
            && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        int id = intent.getIntExtra("id", -1);
        if (id < 0) return;

        SharedPreferences preferences = context.getSharedPreferences(IssPassAlarmScheduler.PREFERENCES, Context.MODE_PRIVATE);
        String title = preferences.getString(id + "_title", null);
        String body = preferences.getString(id + "_body", null);
        if (title == null || body == null) return;
        String kind = preferences.getString(id + "_kind", "iss");
        String timeLabel = preferences.getString(id + "_time", "");
        String route = preferences.getString(id + "_route", "skyview://sky/iss");
        float duration = preferences.getFloat(id + "_duration", 300f);

        IssPassNotification.show(context, id, kind, title, body, timeLabel, duration, route);

        preferences.edit()
            .remove(id + "_kind")
            .remove(id + "_title")
            .remove(id + "_body")
            .remove(id + "_time")
            .remove(id + "_route")
            .remove(id + "_duration")
            .apply();
    }
}
