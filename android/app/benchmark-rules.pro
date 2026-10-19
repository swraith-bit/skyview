# Macrobenchmark runs in the target process and uses Kotlin helpers that are
# not otherwise referenced by the production application.
-keep class kotlin.** { *; }
