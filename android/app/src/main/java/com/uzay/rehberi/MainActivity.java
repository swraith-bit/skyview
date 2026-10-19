package com.uzay.rehberi;

import com.getcapacitor.BridgeActivity;

import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(SkyBackgroundPlugin.class);
        registerPlugin(SkyArTrackingPlugin.class);
        registerPlugin(SkyThemePlugin.class);
        registerPlugin(SkyNotifyPlugin.class);
        registerPlugin(SkySharePlugin.class);
        NativeDiagnostics.install(this);
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
    }
}
