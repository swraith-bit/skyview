package com.uzay.rehberi;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

/** TUR 2 / Faz 6.3 — Özel RemoteViews düzenli ISS geçişi / meteor zirvesi bildirimi. */
final class IssPassNotification {
    static final String ISS_CHANNEL_ID = "skyview_iss_passes";
    static final String METEOR_CHANNEL_ID = "skyview_meteor_peaks";

    private IssPassNotification() {}

    static void show(
        Context context,
        int id,
        String kind,
        String title,
        String body,
        String timeLabel,
        float durationSeconds,
        String route
    ) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        boolean meteor = "meteor".equals(kind);
        String channelId = meteor ? METEOR_CHANNEL_ID : ISS_CHANNEL_ID;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId,
                context.getString(meteor ? R.string.meteor_channel_name : R.string.iss_channel_name),
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription(context.getString(
                meteor ? R.string.meteor_channel_description : R.string.iss_channel_description
            ));
            manager.createNotificationChannel(channel);
        }

        RemoteViews content = new RemoteViews(context.getPackageName(), R.layout.notification_iss_pass);
        content.setTextViewText(R.id.iss_title, title);
        content.setTextViewText(R.id.iss_body, body);
        content.setTextViewText(R.id.iss_time, timeLabel);
        content.setImageViewBitmap(
            R.id.iss_arc,
            meteor ? SkyArcBitmap.renderMeteor(context) : SkyArcBitmap.render(context, durationSeconds)
        );
        content.setImageViewResource(R.id.iss_icon, R.mipmap.ic_launcher);

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(route), context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder notification = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_stat_iss)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
            .setCustomContentView(content)
            .setCustomBigContentView(content)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        manager.notify(id, notification.build());
    }
}
