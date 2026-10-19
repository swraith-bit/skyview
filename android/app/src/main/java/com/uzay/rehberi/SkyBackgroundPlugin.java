package com.uzay.rehberi;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SkyBackground")
public class SkyBackgroundPlugin extends Plugin {
    static final String PREFERENCES = "skyview_background_alerts";

    @PluginMethod
    public void configure(PluginCall call) {
        JSObject data = call.getData();
        SharedPreferences.Editor editor = getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE).edit();
        editor.putBoolean("conditionAlerts", data.optBoolean("conditionAlerts", false));
        editor.putInt("cloudThreshold", data.optInt("cloudThreshold", 30));
        editor.putBoolean("auroraAlerts", data.optBoolean("auroraAlerts", false));
        editor.putInt("kpThreshold", data.optInt("kpThreshold", 5));
        editor.putBoolean("quietHoursEnabled", data.optBoolean("quietHoursEnabled", true));
        editor.putString("quietStart", data.optString("quietStart", "23:00"));
        editor.putString("quietEnd", data.optString("quietEnd", "08:00"));
        editor.putString("timezone", data.optString("timezone", "UTC"));
        editor.putString("clearTitle", data.optString("clearTitle", "Clear sky alert"));
        editor.putString("clearBody", data.optString("clearBody", "Cloud cover: {value}%"));
        editor.putString("auroraTitle", data.optString("auroraTitle", "Aurora activity"));
        editor.putString("auroraBody", data.optString("auroraBody", "Current Kp index: {value}"));
        editor.putString("latitude", data.optString("latitude", "0"));
        editor.putString("longitude", data.optString("longitude", "0"));
        editor.apply();
        BackgroundAlertScheduler.update(getContext());
        call.resolve();
    }
}
