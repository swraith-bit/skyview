package com.uzay.rehberi;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * TUR 2 / Faz 6.2 — Uygulama ile Quick Settings karosu arasındaki köprü.
 *
 * `getScotopic` açılışta kalıcı karo durumunu okur; `setScotopic` uygulamadan
 * yapılan tema seçimini karoya yazar. Karo değişince `scotopicChanged` olayı
 * yayınlanır ve açık uygulama anında tema değiştirir.
 */
@CapacitorPlugin(name = "SkyTheme")
public class SkyThemePlugin extends Plugin {
    private BroadcastReceiver tileReceiver;

    @Override
    public void load() {
        tileReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null) return;
                if (!ScotopicTileService.ACTION_CHANGED.equals(intent.getAction())) return;
                JSObject data = new JSObject();
                data.put("enabled", intent.getBooleanExtra(ScotopicTileService.KEY_SCOTOPIC, false));
                notifyListeners("scotopicChanged", data);
            }
        };
        ContextCompat.registerReceiver(
            getContext(),
            tileReceiver,
            new IntentFilter(ScotopicTileService.ACTION_CHANGED),
            ContextCompat.RECEIVER_NOT_EXPORTED
        );
    }

    @PluginMethod
    public void getScotopic(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", ScotopicTileService.isScotopic(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void setScotopic(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        ScotopicTileService.setScotopic(getContext(), Boolean.TRUE.equals(enabled));
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (tileReceiver != null) {
            try {
                getContext().unregisterReceiver(tileReceiver);
            } catch (IllegalArgumentException ignored) {
                // Receiver zaten çözülmüş olabilir; kapanış akışını bozmayız.
            }
            tileReceiver = null;
        }
        super.handleOnDestroy();
    }
}
