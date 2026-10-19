package com.uzay.rehberi.macrobenchmark;

import androidx.benchmark.macro.CompilationMode;
import androidx.benchmark.macro.StartupMode;
import androidx.benchmark.macro.StartupTimingMetric;
import androidx.benchmark.macro.junit4.MacrobenchmarkRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Collections;

import kotlin.Unit;

@RunWith(AndroidJUnit4.class)
public class StartupBenchmark {
    private static final String TARGET_PACKAGE = "com.uzay.rehberi";

    @Rule
    public MacrobenchmarkRule benchmarkRule = new MacrobenchmarkRule();

    @Test
    public void coldStartup() {
        benchmarkRule.measureRepeated(
            TARGET_PACKAGE,
            Collections.singletonList(new StartupTimingMetric()),
            CompilationMode.DEFAULT,
            StartupMode.COLD,
            5,
            scope -> {
                scope.pressHome();
                return Unit.INSTANCE;
            },
            scope -> {
                scope.startActivityAndWait();
                return Unit.INSTANCE;
            }
        );
    }
}
