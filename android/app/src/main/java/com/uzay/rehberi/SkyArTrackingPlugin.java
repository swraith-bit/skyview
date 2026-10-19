package com.uzay.rehberi;

import android.content.Context;
import android.graphics.Rect;
import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.util.Log;
import android.util.SizeF;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

@CapacitorPlugin(name = "SkyArTracking")
public class SkyArTrackingPlugin extends Plugin implements SensorEventListener {
    private static final String TAG = "SkyArTrackingPlugin";
    private static final long MIN_EMIT_INTERVAL_NS = 16_000_000L;

    private SensorManager sensorManager;
    private Sensor rotationVectorSensor;
    private boolean trackingRequested;
    private long lastEmitTimestamp;
    private int sensorAccuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;
    private float declination;

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            rotationVectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        }
    }

    @PluginMethod
    public void startTracking(PluginCall call) {
        Double latitude = call.getDouble("latitude");
        Double longitude = call.getDouble("longitude");
        double safeLatitude = latitude == null ? 0.0 : latitude;
        double safeLongitude = longitude == null ? 0.0 : longitude;
        GeomagneticField field = new GeomagneticField(
            (float) safeLatitude,
            (float) safeLongitude,
            0,
            System.currentTimeMillis()
        );
        declination = field.getDeclination();
        trackingRequested = true;

        JSObject result = new JSObject();
        result.put("available", registerSensorListener());
        result.put("declination", declination);
        call.resolve(result);
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        trackingRequested = false;
        unregisterSensorListener();
        call.resolve();
    }

    @PluginMethod
    public void getCameraModel(PluginCall call) {
        CameraManager cameraManager = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
        if (cameraManager == null) {
            Log.w(TAG, "getCameraModel: CameraManager service is unavailable");
            call.resolve(unavailableCameraModel("no_camera_service"));
            return;
        }

        try {
            String selectedCameraId = selectBackCamera(cameraManager);
            if (selectedCameraId == null) {
                Log.w(TAG, "getCameraModel: No back-facing camera found");
                call.resolve(unavailableCameraModel("no_back_camera"));
                return;
            }

            CameraCharacteristics characteristics = cameraManager.getCameraCharacteristics(selectedCameraId);
            SizeF physicalSize = characteristics.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE);
            Rect activeArray = characteristics.get(CameraCharacteristics.SENSOR_INFO_ACTIVE_ARRAY_SIZE);
            float[] focalLengths = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS);
            if (physicalSize == null || activeArray == null || focalLengths == null || focalLengths.length == 0) {
                Log.w(TAG, "getCameraModel: Missing sensor/lens characteristics for cameraId=" + selectedCameraId);
                call.resolve(unavailableCameraModel("missing_characteristics"));
                return;
            }

            float focalLength = selectPrimaryFocalLength(physicalSize.getWidth(), focalLengths);
            double horizontalFov = Math.toDegrees(2.0 * Math.atan(physicalSize.getWidth() / (2.0 * focalLength)));
            double verticalFov = Math.toDegrees(2.0 * Math.atan(physicalSize.getHeight() / (2.0 * focalLength)));

            JSObject result = new JSObject();
            result.put("available", true);
            result.put("cameraId", selectedCameraId);
            result.put("horizontalFov", horizontalFov);
            result.put("verticalFov", verticalFov);
            result.put("sensorWidth", activeArray.width());
            result.put("sensorHeight", activeArray.height());
            result.put("focalLengthMm", focalLength);
            call.resolve(result);
        } catch (SecurityException exception) {
            Log.w(TAG, "getCameraModel: Camera permission not granted yet", exception);
            call.resolve(unavailableCameraModel("permission_denied"));
        } catch (CameraAccessException exception) {
            Log.w(TAG, "getCameraModel: CameraAccessException while reading characteristics", exception);
            call.resolve(unavailableCameraModel("camera_access_error"));
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (!trackingRequested || event.sensor.getType() != Sensor.TYPE_ROTATION_VECTOR) return;
        if (event.timestamp - lastEmitTimestamp < MIN_EMIT_INTERVAL_NS) return;
        lastEmitTimestamp = event.timestamp;
        sensorAccuracy = event.accuracy;

        float[] rotationMatrix = new float[9];
        float[] quaternion = new float[4];
        SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values);
        SensorManager.getQuaternionFromVector(quaternion, event.values);

        JSArray matrix = new JSArray();
        JSArray quaternionValues = new JSArray();
        try {
            for (float value : rotationMatrix) matrix.put(value);
            for (float value : quaternion) quaternionValues.put(value);
        } catch (JSONException exception) {
            return;
        }

        JSObject payload = new JSObject();
        payload.put("matrix", matrix);
        payload.put("quaternion", quaternionValues);
        payload.put("declination", declination);
        payload.put("accuracy", accuracyLabel(sensorAccuracy));
        payload.put("timestamp", event.timestamp / 1_000_000.0);
        notifyListeners("orientationChange", payload);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (sensor != null && sensor.getType() == Sensor.TYPE_ROTATION_VECTOR) {
            sensorAccuracy = accuracy;
        }
    }

    @Override
    protected void handleOnPause() {
        unregisterSensorListener();
    }

    @Override
    protected void handleOnResume() {
        if (trackingRequested) registerSensorListener();
    }

    private boolean registerSensorListener() {
        if (sensorManager == null || rotationVectorSensor == null) return false;
        unregisterSensorListener();
        lastEmitTimestamp = 0;
        return sensorManager.registerListener(this, rotationVectorSensor, SensorManager.SENSOR_DELAY_GAME);
    }

    private void unregisterSensorListener() {
        if (sensorManager != null) sensorManager.unregisterListener(this);
    }

    private String selectBackCamera(CameraManager cameraManager) throws CameraAccessException {
        String fallback = null;
        for (String cameraId : cameraManager.getCameraIdList()) {
            CameraCharacteristics characteristics = cameraManager.getCameraCharacteristics(cameraId);
            Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);
            if (facing == null || facing != CameraCharacteristics.LENS_FACING_BACK) continue;
            if (fallback == null) fallback = cameraId;
            int[] capabilities = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES);
            if (capabilities == null) continue;
            for (int capability : capabilities) {
                if (capability == CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA) {
                    return cameraId;
                }
            }
        }
        return fallback;
    }

    private JSObject unavailableCameraModel(String reason) {
        JSObject result = new JSObject();
        result.put("available", false);
        result.put("reason", reason);
        return result;
    }

    private float selectPrimaryFocalLength(float sensorWidthMm, float[] focalLengths) {
        float selected = focalLengths[0];
        double closestDistance = Double.MAX_VALUE;
        for (float candidate : focalLengths) {
            if (candidate <= 0) continue;
            double horizontalFov = Math.toDegrees(2.0 * Math.atan(sensorWidthMm / (2.0 * candidate)));
            double distance = Math.abs(horizontalFov - 70.0);
            if (distance < closestDistance) {
                selected = candidate;
                closestDistance = distance;
            }
        }
        return selected;
    }

    private String accuracyLabel(int accuracy) {
        if (accuracy == SensorManager.SENSOR_STATUS_ACCURACY_HIGH) return "high";
        if (accuracy == SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM) return "medium";
        if (accuracy == SensorManager.SENSOR_STATUS_ACCURACY_LOW) return "low";
        return "unreliable";
    }
}
