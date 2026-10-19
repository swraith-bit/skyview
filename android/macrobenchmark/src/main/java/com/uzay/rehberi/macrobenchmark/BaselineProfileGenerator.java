package com.uzay.rehberi.macrobenchmark;

import androidx.benchmark.macro.junit4.BaselineProfileRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import kotlin.Unit;
import java.util.regex.Pattern;

@RunWith(AndroidJUnit4.class)
public class BaselineProfileGenerator {
    private static final String TARGET_PACKAGE = "com.uzay.rehberi";
    private static final long TIMEOUT = 8_000;

    @Rule
    public BaselineProfileRule baselineProfileRule = new BaselineProfileRule();

    @Test
    public void generate() {
        baselineProfileRule.collect(
            TARGET_PACKAGE,
            scope -> {
                scope.pressHome();
                scope.startActivityAndWait();
                UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
                clickIfPresent(device, "Gökyüzü|Sky");
                clickIfPresent(device, "Hedefler|Targets");
                device.pressBack();
                clickIfPresent(device, "Planla|Plan");
                clickIfPresent(device, "Bugün|Today");
                return Unit.INSTANCE;
            }
        );
    }

    private static void clickIfPresent(UiDevice device, String textPattern) {
        UiObject2 object = device.wait(Until.findObject(By.text(Pattern.compile(textPattern))), TIMEOUT);
        if (object != null) {
            object.click();
            device.waitForIdle();
        }
    }
}
