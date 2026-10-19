package com.uzay.rehberi;

import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;

/**
 * TUR 2 / Faz 6.4 — Gözlem kartını Android paylaşım sayfasına verir.
 *
 * WebView'de blob indirme ve Web Share API güvenilir değil; PNG base64 olarak
 * köprüden geçer, önbelleğe yazılır ve FileProvider içerik URI'siyle paylaşılır.
 */
@CapacitorPlugin(name = "SkyShare")
public class SkySharePlugin extends Plugin {
    @PluginMethod
    public void shareImage(PluginCall call) {
        String base64 = call.getString("base64");
        if (base64 == null || base64.isEmpty()) {
            call.reject("base64 is required");
            return;
        }

        String filename = call.getString("filename", "skyview-observation.png");
        if (filename == null) filename = "skyview-observation.png";
        // Çağıran bizim kodumuz olsa da yol geçişine izin verme.
        filename = new File(filename).getName();
        String title = call.getString("title", "SkyView");
        String text = call.getString("text", "");

        try {
            int comma = base64.indexOf(',');
            String payload = base64.startsWith("data:") && comma >= 0
                ? base64.substring(comma + 1)
                : base64;
            byte[] bytes = Base64.decode(payload, Base64.DEFAULT);

            File directory = new File(getContext().getCacheDir(), "shared");
            if (!directory.exists() && !directory.mkdirs()) {
                call.reject("Share cache directory could not be created");
                return;
            }
            File file = new File(directory, filename);
            try (FileOutputStream stream = new FileOutputStream(file)) {
                stream.write(bytes);
            }

            Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                file
            );
            Intent send = new Intent(Intent.ACTION_SEND)
                .setType("image/png")
                .putExtra(Intent.EXTRA_STREAM, uri)
                .putExtra(Intent.EXTRA_SUBJECT, title)
                .putExtra(Intent.EXTRA_TEXT, text)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, title)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);

            JSObject result = new JSObject();
            result.put("shared", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Observation card could not be shared", error);
        }
    }
}
