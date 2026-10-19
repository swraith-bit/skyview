import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';

export type NativeSensorAccuracy = 'high' | 'medium' | 'low' | 'unreliable';
export type RotationMatrix3 = [number, number, number, number, number, number, number, number, number];
export type Quaternion4 = [number, number, number, number];

export interface NativeOrientationEvent {
  matrix: RotationMatrix3;
  quaternion: Quaternion4;
  declination: number;
  accuracy: NativeSensorAccuracy;
  timestamp: number;
}

export interface NativeCameraModel {
  available: boolean;
  reason?: string;
  cameraId?: string;
  horizontalFov?: number;
  verticalFov?: number;
  sensorWidth?: number;
  sensorHeight?: number;
  focalLengthMm?: number;
}

interface NativeTrackingStartResult {
  available: boolean;
  declination: number;
}

interface SkyArTrackingPlugin {
  startTracking(options: { latitude: number; longitude: number }): Promise<NativeTrackingStartResult>;
  stopTracking(): Promise<void>;
  getCameraModel(): Promise<NativeCameraModel>;
  addListener(
    eventName: 'orientationChange',
    listener: (event: NativeOrientationEvent) => void,
  ): Promise<PluginListenerHandle>;
}

export const SkyArTracking = registerPlugin<SkyArTrackingPlugin>('SkyArTracking');

export const canUseNativeArTracking = (): boolean => (
  Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('SkyArTracking')
);

export const getNativeCameraModel = async (): Promise<NativeCameraModel | null> => {
  if (!canUseNativeArTracking()) return null;
  try {
    const model = await SkyArTracking.getCameraModel();
    if (!model.available) {
      if (model.reason) {
        console.debug(`Native camera model unavailable (${model.reason}); using fallback FOV.`);
      }
      return null;
    }
    return model;
  } catch (error) {
    console.warn('getNativeCameraModel failed:', error);
    return null;
  }
};
