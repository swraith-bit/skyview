# SkyView Macrobenchmark

Run the startup benchmark on a physical Android 14+ device from Android Studio,
or from the `android` directory:

```powershell
.\gradlew.bat :macrobenchmark:connectedBenchmarkAndroidTest
```

Generate a profile on a physical Android 14+ device with:

```powershell
.\gradlew.bat :macrobenchmark:connectedBenchmarkAndroidTest `
  -Pandroid.testInstrumentationRunnerArguments.class=com.uzay.rehberi.macrobenchmark.BaselineProfileGenerator
```

The generator covers startup plus the Today, Sky, Targets and Plan critical
journeys. The generated profile is written to the benchmark test output. Copy the
`baseline-prof.txt` result into `app/src/main/baseline-prof.txt`, then repeat the
cold startup benchmark and keep the profile only when the measurements improve.
The benchmark module and generator are not packaged in the application APK.
