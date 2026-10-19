export type ArRenderQuality = 'high' | 'balanced' | 'battery-saver';

export interface ArQualityProfile {
  id: ArRenderQuality;
  maxDpr: number;
  minFrameIntervalMs: number;
  labelKey: string;
}

interface DeviceCapabilities {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  devicePixelRatio?: number;
}

export const getArQualityProfile = (device: DeviceCapabilities): ArQualityProfile => {
  const cores = device.hardwareConcurrency ?? 6;
  const memory = device.deviceMemory ?? 4;
  if (cores <= 4 || memory <= 2) {
    return { id: 'battery-saver', maxDpr: 1.25, minFrameIntervalMs: 1000 / 24, labelKey: 'qualitySaver' };
  }
  if (cores <= 6 || memory <= 4 || (device.devicePixelRatio ?? 1) > 2.5) {
    return { id: 'balanced', maxDpr: 1.5, minFrameIntervalMs: 1000 / 30, labelKey: 'qualityBalanced' };
  }
  return { id: 'high', maxDpr: 2, minFrameIntervalMs: 1000 / 30, labelKey: 'qualityHigh' };
};

export const getCurrentArQualityProfile = (): ArQualityProfile => {
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  return getArQualityProfile({
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigatorWithMemory.deviceMemory,
    devicePixelRatio: window.devicePixelRatio,
  });
};
