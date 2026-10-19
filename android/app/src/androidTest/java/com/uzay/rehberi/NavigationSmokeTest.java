package com.uzay.rehberi;

import static org.junit.Assert.assertTrue;

import android.Manifest;
import android.content.Context;
import android.content.Intent;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.GrantPermissionRule;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.Until;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.regex.Pattern;

@RunWith(AndroidJUnit4.class)
public class NavigationSmokeTest {
    private static final long TIMEOUT = 15_000;
    private UiDevice device;

    @Rule
    public GrantPermissionRule locationPermissions = GrantPermissionRule.grant(
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.ACCESS_FINE_LOCATION
    );

    @Before
    public void launchApp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        Context context = ApplicationProvider.getApplicationContext();
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (intent == null) throw new IllegalStateException("Launch intent missing");
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        assertTrue(device.wait(Until.hasObject(By.text(Pattern.compile("Gökyüzü|Sky"))), TIMEOUT));
    }

    @Test
    public void backFromSkyTargetReturnsToSkyOverview() {
        device.findObject(By.text(Pattern.compile("Gökyüzü|Sky"))).click();
        assertTrue(device.wait(Until.hasObject(By.text(Pattern.compile("Hedefler|Targets"))), TIMEOUT));
        device.findObject(By.text(Pattern.compile("Hedefler|Targets"))).click();
        assertTrue(device.wait(Until.hasObject(By.text(Pattern.compile("Bu Gece Görülebilir|Visible Tonight"))), TIMEOUT));
        device.pressBack();
        assertTrue(device.wait(Until.hasObject(By.text(Pattern.compile("Gökyüzü Araçları|Sky Tools"))), TIMEOUT));
    }
}
