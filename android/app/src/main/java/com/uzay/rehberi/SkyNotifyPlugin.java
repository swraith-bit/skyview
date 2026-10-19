package com.uzay.rehberi;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** TUR 2 / Faz 6.3 — Mini grafikli ISS geçişi ve meteor zirvesi bildirimleri. */
@CapacitorPlugin(name = "SkyNotify")
public class SkyNotifyPlugin extends Plugin {
    @PluginMethod
    public void scheduleIssPass(PluginCall call) {
        scheduleEvent(call, "iss", "skyview://sky/iss");
    }

    @PluginMethod
    public void scheduleMeteorPeak(PluginCall call) {
        scheduleEvent(call, "meteor", "skyview://plan/meteor");
    }

    private void scheduleEvent(PluginCall call, String kind, String fallbackRoute) {
        Integer id = call.getInt("id");
        Double triggerAtMs = call.getDouble("triggerAtMs");
        String title = call.getString("title");
        String body = call.getString("body");
        if (id == null || triggerAtMs == null || title == null || body == null) {
            call.reject("id, triggerAtMs, title and body are required");
            return;
        }

        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT >= 33
            && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            result.put("scheduled", false);
            result.put("exact", false);
            call.resolve(result);
            return;
        }

        String timeLabel = call.getString("timeLabel", "");
        String route = call.getString("route", fallbackRoute);
        Double duration = call.getDouble("durationSeconds");
        boolean preferExact = Boolean.TRUE.equals(call.getBoolean("exact"));
        boolean exact = IssPassAlarmScheduler.schedule(
            getContext(),
            id,
            triggerAtMs.longValue(),
            kind,
            title,
            body,
            timeLabel,
            duration == null ? 0f : duration.floatValue(),
            route,
            preferExact
        );
        result.put("scheduled", true);
        result.put("exact", exact);
        call.resolve(result);
    }

    @PluginMethod
    public void cancelEvent(PluginCall call) {
        Integer id = call.getInt("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        IssPassAlarmScheduler.cancel(getContext(), id);
        call.resolve();
    }
}
