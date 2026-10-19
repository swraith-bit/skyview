package com.uzay.rehberi;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.drawable.Icon;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * TUR 2 / Faz 6.2 — Kırmızı Gece Modu Quick Settings karosu.
 *
 * Bildirim çubuğundan tek dokunuşla scotopic profili açar/kapatır. Durum
 * `skyview_native_theme` tercihinde tutulur; uygulama açılışta bu değeri okur
 * ve çalışırken gönderilen yayınla anında tema değiştirir.
 */
public class ScotopicTileService extends TileService {
    static final String PREFERENCES = "skyview_native_theme";
    static final String KEY_SCOTOPIC = "scotopic";
    static final String ACTION_CHANGED = "com.uzay.rehberi.SCOTOPIC_CHANGED";

    static boolean isScotopic(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        return preferences.getBoolean(KEY_SCOTOPIC, false);
    }

    static void setScotopic(Context context, boolean enabled) {
        context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_SCOTOPIC, enabled)
            .apply();
        // Karonun bir sonraki açılışta doğru durumu çizmesini sağlar.
        TileService.requestListeningState(
            context,
            new ComponentName(context, ScotopicTileService.class)
        );
    }

    @Override
    public void onStartListening() {
        super.onStartListening();
        updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        boolean enabled = !isScotopic(this);
        setScotopic(this, enabled);
        updateTile();
        Intent changed = new Intent(ACTION_CHANGED)
            .setPackage(getPackageName())
            .putExtra(KEY_SCOTOPIC, enabled);
        sendBroadcast(changed);
    }

    private void updateTile() {
        Tile tile = getQsTile();
        if (tile == null) return;
        boolean enabled = isScotopic(this);
        tile.setState(enabled ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
        tile.setLabel(getString(R.string.tile_scotopic));
        tile.setIcon(Icon.createWithResource(this, R.drawable.ic_tile_scotopic));
        tile.updateTile();
    }
}
