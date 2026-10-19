package com.uzay.rehberi;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.Shader;

/**
 * TUR 2 / Faz 6.3 — Zengin bildirim grafikleri.
 *
 * RemoteViews özel View kabul etmediği için grafik çizilip Bitmap olarak
 * ImageView'a verilir. ISS yayının yüksekliği geçiş süresinden türetilir;
 * uydunun maksimum yüksekliği API'de bulunmadığından sahte bir derece
 * üretilmez. Meteor zirvesinde ise ufuk çizgisi olmadan yalnızca akanyıldız
 * izleri çizilir.
 */
final class SkyArcBitmap {
    private SkyArcBitmap() {}

    static Bitmap render(Context context, float durationSeconds) {
        float density = context.getResources().getDisplayMetrics().density;
        int width = Math.max(1, (int) (320 * density));
        int height = Math.max(1, (int) (92 * density));
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        float left = 16 * density;
        float right = width - 16 * density;
        float horizonY = height - 12 * density;
        float normalized = Math.min(1f, Math.max(0f, (durationSeconds - 60f) / 480f));
        float peakY = horizonY - (20f + 44f * normalized) * density;

        Paint horizon = new Paint(Paint.ANTI_ALIAS_FLAG);
        horizon.setStyle(Paint.Style.STROKE);
        horizon.setStrokeWidth(1f * density);
        horizon.setColor(0x33818CF8);
        horizon.setPathEffect(new DashPathEffect(new float[]{4 * density, 6 * density}, 0));
        canvas.drawLine(left, horizonY, right, horizonY, horizon);

        Paint arc = new Paint(Paint.ANTI_ALIAS_FLAG);
        arc.setStyle(Paint.Style.STROKE);
        arc.setStrokeWidth(2.6f * density);
        arc.setStrokeCap(Paint.Cap.ROUND);
        arc.setShader(new LinearGradient(
            left, horizonY, right, peakY,
            new int[]{0xFF38BDF8, 0xFF818CF8, 0xFF38BDF8},
            null,
            Shader.TileMode.CLAMP
        ));
        Path path = new Path();
        path.moveTo(left, horizonY);
        path.quadTo(width / 2f, peakY, right, horizonY);
        canvas.drawPath(path, arc);

        // Kuadratik eğrinin tepe noktası (t=0.5).
        float apexY = (horizonY + peakY) / 2f;
        Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
        glow.setColor(0x33818CF8);
        canvas.drawCircle(width / 2f, apexY, 9 * density, glow);
        Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
        dot.setColor(0xFFF8FAFC);
        canvas.drawCircle(width / 2f, apexY, 3.4f * density, dot);

        return bitmap;
    }

    static Bitmap renderMeteor(Context context) {
        float density = context.getResources().getDisplayMetrics().density;
        int width = Math.max(1, (int) (320 * density));
        int height = Math.max(1, (int) (92 * density));
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        // Sabit yıldız tozu — her bildirimde aynı, göz yormayan arka plan.
        Paint stars = new Paint(Paint.ANTI_ALIAS_FLAG);
        stars.setColor(0x66E2E8F0);
        float[][] starPoints = {
            {0.08f, 0.24f, 1.1f}, {0.19f, 0.62f, 0.8f}, {0.31f, 0.18f, 1.0f},
            {0.44f, 0.74f, 0.7f}, {0.58f, 0.30f, 1.2f}, {0.70f, 0.66f, 0.9f},
            {0.82f, 0.20f, 1.0f}, {0.91f, 0.52f, 0.8f}, {0.95f, 0.78f, 1.1f},
        };
        for (float[] point : starPoints) {
            canvas.drawCircle(point[0] * width, point[1] * height, point[2] * density, stars);
        }

        // Üç akanyıldız izi: kuyruk saydamdan parlak başa doğru.
        float[][] streaks = {
            {0.10f, 0.30f, 0.42f, 0.66f, 2.4f, 0xFF7DD3FC},
            {0.46f, 0.14f, 0.76f, 0.52f, 3.0f, 0xFFF8FAFC},
            {0.64f, 0.70f, 0.90f, 0.38f, 2.0f, 0xFFFDE68A},
        };
        for (float[] streak : streaks) {
            float x0 = streak[0] * width;
            float y0 = streak[1] * height;
            float x1 = streak[2] * width;
            float y1 = streak[3] * height;
            int headColor = (int) streak[5];

            Paint tail = new Paint(Paint.ANTI_ALIAS_FLAG);
            tail.setStyle(Paint.Style.STROKE);
            tail.setStrokeWidth(streak[4] * density);
            tail.setStrokeCap(Paint.Cap.ROUND);
            tail.setShader(new LinearGradient(
                x0, y0, x1, y1,
                new int[]{0x00FFFFFF, headColor},
                new float[]{0f, 1f},
                Shader.TileMode.CLAMP
            ));
            canvas.drawLine(x0, y0, x1, y1, tail);

            Paint headGlow = new Paint(Paint.ANTI_ALIAS_FLAG);
            headGlow.setShader(new RadialGradient(
                x1, y1, 8 * density,
                new int[]{0x66FFFFFF, 0x00FFFFFF},
                null,
                Shader.TileMode.CLAMP
            ));
            canvas.drawCircle(x1, y1, 8 * density, headGlow);
            Paint head = new Paint(Paint.ANTI_ALIAS_FLAG);
            head.setColor(headColor);
            canvas.drawCircle(x1, y1, 1.8f * density, head);
        }

        return bitmap;
    }
}
