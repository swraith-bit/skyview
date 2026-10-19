package com.uzay.rehberi;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class BackgroundAlertWorker extends Worker {
    static final int CLEAR_SKY_NOTIFICATION_ID = 920001;
    static final int AURORA_NOTIFICATION_ID = 920002;
    private static final String CHANNEL_ID = "skyview_background_alerts";

    public BackgroundAlertWorker(@NonNull Context context, @NonNull WorkerParameters parameters) {
        super(context, parameters);
    }

    @NonNull
    @Override
    public Result doWork() {
        SharedPreferences preferences = getApplicationContext().getSharedPreferences(SkyBackgroundPlugin.PREFERENCES, Context.MODE_PRIVATE);
        if (isQuietTime(preferences)) return Result.success();
        try {
            if (preferences.getBoolean("conditionAlerts", false)) evaluateCloud(preferences);
            if (preferences.getBoolean("auroraAlerts", false)) evaluateAurora(preferences);
            return Result.success();
        } catch (Exception ignored) {
            return getRunAttemptCount() < 3 ? Result.retry() : Result.failure();
        }
    }

    private void evaluateCloud(SharedPreferences preferences) throws Exception {
        String latitude = preferences.getString("latitude", "0");
        String longitude = preferences.getString("longitude", "0");
        URL url = new URL("https://api.open-meteo.com/v1/forecast?latitude=" + latitude + "&longitude=" + longitude + "&current=cloud_cover&timezone=auto");
        JSONObject payload = new JSONObject(read(url));
        JSONObject current = payload.optJSONObject("current");
        if (current == null || !current.has("cloud_cover")) return;
        int cloud = (int) Math.round(current.optDouble("cloud_cover", 101));
        if (cloud > preferences.getInt("cloudThreshold", 30)) return;
        String dateKey = localDateKey(preferences);
        if (dateKey.equals(preferences.getString("lastClearSkyDate", ""))) return;
        boolean delivered = notifyUser(
            CLEAR_SKY_NOTIFICATION_ID,
            preferences.getString("clearTitle", "Clear sky alert"),
            preferences.getString("clearBody", "Cloud cover: {value}%").replace("{value}", String.valueOf(cloud)),
            "skyview://today"
        );
        if (delivered) preferences.edit().putString("lastClearSkyDate", dateKey).apply();
    }

    private void evaluateAurora(SharedPreferences preferences) throws Exception {
        JSONArray payload = new JSONArray(read(new URL("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")));
        Double kp = null;
        for (int index = payload.length() - 1; index >= 0; index--) {
            JSONArray row = payload.optJSONArray(index);
            if (row == null || row.length() < 2) continue;
            try {
                kp = Double.parseDouble(row.optString(1));
                break;
            } catch (NumberFormatException ignored) { }
        }
        if (kp == null || kp < preferences.getInt("kpThreshold", 5)) return;
        String dateKey = localDateKey(preferences);
        if (dateKey.equals(preferences.getString("lastAuroraDate", ""))) return;
        boolean delivered = notifyUser(
            AURORA_NOTIFICATION_ID,
            preferences.getString("auroraTitle", "Aurora activity"),
            preferences.getString("auroraBody", "Current Kp index: {value}").replace("{value}", String.format(Locale.US, "%.1f", kp)),
            "skyview://today"
        );
        if (delivered) preferences.edit().putString("lastAuroraDate", dateKey).apply();
    }

    private String read(URL url) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(10_000);
        connection.setReadTimeout(10_000);
        connection.setRequestProperty("Accept", "application/json");
        try {
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) throw new IllegalStateException("HTTP failure");
            StringBuilder result = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) result.append(line);
            }
            return result.toString();
        } finally {
            connection.disconnect();
        }
    }

    private boolean notifyUser(int id, String title, String body, String route) {
        Context context = getApplicationContext();
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "Sky alerts", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(route), context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder notification = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT);
        manager.notify(id, notification.build());
        return true;
    }

    private boolean isQuietTime(SharedPreferences preferences) {
        if (!preferences.getBoolean("quietHoursEnabled", true)) return false;
        int start = parseMinutes(preferences.getString("quietStart", "23:00"), 23 * 60);
        int end = parseMinutes(preferences.getString("quietEnd", "08:00"), 8 * 60);
        Calendar calendar = Calendar.getInstance(resolveTimeZone(preferences));
        int current = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE);
        return start > end ? current >= start || current < end : current >= start && current < end;
    }

    private int parseMinutes(String value, int fallback) {
        try {
            String[] parts = value.split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private TimeZone resolveTimeZone(SharedPreferences preferences) {
        return TimeZone.getTimeZone(preferences.getString("timezone", "UTC"));
    }

    private String localDateKey(SharedPreferences preferences) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        format.setTimeZone(resolveTimeZone(preferences));
        return format.format(new Date());
    }
}
