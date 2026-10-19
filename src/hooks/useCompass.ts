import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  canUseNativeArTracking,
  NativeSensorAccuracy,
  RotationMatrix3,
  SkyArTracking,
} from '../native/skyArTracking';

type DeviceOrientationWithCompass = DeviceOrientationEvent & {
  absolute?: boolean;
  webkitCompassHeading?: number;
};

type DeviceOrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | 'prompt'>;
};

export type SensorStatus = 'checking' | 'active' | 'denied' | 'not-supported' | 'requires-interaction';
export type TrackingQuality = 'good' | 'fair' | 'poor';
export interface ArOrientation {
  alpha: number;
  beta: number;
  gamma: number;
  matrix: RotationMatrix3 | null;
  declination: number;
  source: 'native' | 'web';
}

export const getTrackingQuality = (
  sensorStatus: SensorStatus,
  absoluteHeading: boolean,
  calibrated: boolean,
  nativeAccuracy?: NativeSensorAccuracy,
): TrackingQuality => {
  if (sensorStatus !== 'active' || nativeAccuracy === 'unreliable') return 'poor';
  if (nativeAccuracy === 'low') return 'fair';
  return absoluteHeading || calibrated ? 'good' : 'fair';
};

const radiansToDegrees = (value: number) => value * 180 / Math.PI;
const normalizeSignedZero = (value: number) => Object.is(value, -0) ? 0 : value;

export const orientationAnglesFromMatrix = (matrix: RotationMatrix3) => ({
  alpha: normalizeSignedZero((radiansToDegrees(Math.atan2(-matrix[1], matrix[4])) + 360) % 360),
  beta: normalizeSignedZero(radiansToDegrees(Math.asin(Math.max(-1, Math.min(1, matrix[7]))))),
  gamma: normalizeSignedZero(radiansToDegrees(Math.atan2(-matrix[6], matrix[8]))),
});

// F2.7: snapping to ~111 m (0.001°) keeps coordinate-driven effects from restarting
// the native tracker on every noisy GPS fix (§6.2), while magnetic declination —
// the only coordinate input — varies meaningfully only over tens of kilometres.
export const snapCoordinatesForTracking = (latitude: number, longitude: number) => {
  const snap = (value: number) => (Number.isFinite(value) ? Number(value.toFixed(3)) : 0);
  return { latitude: snap(latitude), longitude: snap(longitude) };
};

export const useCompass = (latitude = 0, longitude = 0) => {
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('checking');
  const sensorStatusRef = useRef<SensorStatus>('checking');
  const [iosPermissionGranted, setIosPermissionGranted] = useState<boolean>(false);
  const [absoluteHeading, setAbsoluteHeading] = useState(false);
  const [nativeAccuracy, setNativeAccuracy] = useState<NativeSensorAccuracy | undefined>();

  const [showCalibWizard, setShowCalibWizard] = useState<boolean>(false);
  const [calibSuccess, setCalibSuccess] = useState<boolean>(false);
  const [calibRanges, setCalibRanges] = useState<{
    minBeta: number;
    maxBeta: number;
    minGamma: number;
    maxGamma: number;
  }>({ minBeta: 0, maxBeta: 0, minGamma: 0, maxGamma: 0 });

  const orientationRef = useRef<ArOrientation>({
    alpha: 0,
    beta: 0,
    gamma: 0,
    matrix: null,
    declination: 0,
    source: 'web',
  });

  const setSensorStatusIfChanged = useCallback((nextStatus: SensorStatus) => {
    if (sensorStatusRef.current === nextStatus) return;
    sensorStatusRef.current = nextStatus;
    setSensorStatus(nextStatus);
  }, []);

  // F2.7: native orientation events run at ~60 Hz; deduplicating unchanged values
  // turns most re-observations into no-ops instead of three re-renders per event.
  const nativeAccuracyRef = useRef<NativeSensorAccuracy | undefined>(undefined);
  const setNativeAccuracyIfChanged = useCallback((next: NativeSensorAccuracy) => {
    if (nativeAccuracyRef.current === next) return;
    nativeAccuracyRef.current = next;
    setNativeAccuracy(next);
  }, []);

  const absoluteHeadingRef = useRef(false);
  const setAbsoluteHeadingIfChanged = useCallback((next: boolean) => {
    if (absoluteHeadingRef.current === next) return;
    absoluteHeadingRef.current = next;
    setAbsoluteHeading(next);
  }, []);

  const startCalibration = useCallback(() => {
    const current = orientationRef.current;
    setCalibRanges({
      minBeta: current.beta,
      maxBeta: current.beta,
      minGamma: current.gamma,
      maxGamma: current.gamma
    });
    setCalibSuccess(false);
    setShowCalibWizard(true);
  }, []);

  useEffect(() => {
    if (!showCalibWizard || calibSuccess) return;

    const checkInterval = setInterval(() => {
      const current = orientationRef.current;
      setCalibRanges((prev: { minBeta: number; maxBeta: number; minGamma: number; maxGamma: number }) => {
        const next = {
          minBeta: Math.min(prev.minBeta, current.beta),
          maxBeta: Math.max(prev.maxBeta, current.beta),
          minGamma: Math.min(prev.minGamma, current.gamma),
          maxGamma: Math.max(prev.maxGamma, current.gamma)
        };

        const deltaBeta = next.maxBeta - next.minBeta;
        const deltaGamma = next.maxGamma - next.minGamma;
        const TARGET_DELTA = 45;

        if (deltaBeta >= TARGET_DELTA && deltaGamma >= TARGET_DELTA) {
          setCalibSuccess(true);
          setSensorStatusIfChanged('active');
          clearInterval(checkInterval);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(checkInterval);
  }, [showCalibWizard, calibSuccess, setSensorStatusIfChanged]);

  useEffect(() => {
    if (calibSuccess) {
      const timer = setTimeout(() => {
        setShowCalibWizard(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [calibSuccess]);

  const deltaBeta = calibRanges.maxBeta - calibRanges.minBeta;
  const deltaGamma = calibRanges.maxGamma - calibRanges.minGamma;
  const TARGET_DELTA = 45;
  const pitchProgress = Math.min(100, Math.round((deltaBeta / TARGET_DELTA) * 100));
  const rollProgress = Math.min(100, Math.round((deltaGamma / TARGET_DELTA) * 100));
  const calibProgress = Math.round((pitchProgress + rollProgress) / 2);

  // F2.7: the snapped pair keeps a stable identity while GPS noise stays below
  // ~111 m, so this effect (which stops/starts the native tracker) only re-runs
  // when the position actually moved a meaningful distance.
  const lastTrackingKeyRef = useRef<string | null>(null);
  const lastTrackingCoordsRef = useRef<{ latitude: number; longitude: number }>({ latitude: 0, longitude: 0 });
  const trackingCoords = useMemo(() => {
    const snapped = snapCoordinatesForTracking(latitude, longitude);
    const key = `${snapped.latitude},${snapped.longitude}`;
    if (lastTrackingKeyRef.current === key) return lastTrackingCoordsRef.current;
    lastTrackingKeyRef.current = key;
    lastTrackingCoordsRef.current = snapped;
    return snapped;
  }, [latitude, longitude]);

  const [webFallbackNeeded, setWebFallbackNeeded] = useState(false);

  // F2.7: retries run on each meaningful position change; an already-active web
  // fallback must keep its 'active' status instead of flickering to 'not-supported'
  // until web events re-assert it.
  const markNativeUnavailable = useCallback(() => {
    if (sensorStatusRef.current !== 'active') setSensorStatusIfChanged('not-supported');
    setWebFallbackNeeded(true);
  }, [setSensorStatusIfChanged]);

  useEffect(() => {
    if (!canUseNativeArTracking()) return;

    let disposed = false;
    let listenerHandle: Awaited<ReturnType<typeof SkyArTracking.addListener>> | null = null;
    const start = async () => {
      listenerHandle = await SkyArTracking.addListener('orientationChange', event => {
        if (disposed || !Array.isArray(event.matrix) || event.matrix.length !== 9) return;
        const matrix = event.matrix as RotationMatrix3;
        const angles = orientationAnglesFromMatrix(matrix);
        orientationRef.current = {
          ...angles,
          matrix,
          declination: Number.isFinite(event.declination) ? event.declination : 0,
          source: 'native',
        };
        setNativeAccuracyIfChanged(event.accuracy);
        setAbsoluteHeadingIfChanged(true);
        setSensorStatusIfChanged('active');
      });
      if (disposed) {
        await listenerHandle.remove();
        listenerHandle = null;
        return;
      }
      const result = await SkyArTracking.startTracking({
        latitude: trackingCoords.latitude,
        longitude: trackingCoords.longitude,
      });
      if (disposed) {
        await SkyArTracking.stopTracking();
        return;
      }
      if (!result.available) {
        markNativeUnavailable();
      } else {
        setWebFallbackNeeded(false);
      }
    };
    void start().catch(() => {
      if (!disposed) markNativeUnavailable();
    });

    return () => {
      disposed = true;
      void listenerHandle?.remove();
      void SkyArTracking.stopTracking().catch(() => undefined);
    };
  }, [trackingCoords, markNativeUnavailable, setSensorStatusIfChanged, setNativeAccuracyIfChanged, setAbsoluteHeadingIfChanged]);

  useEffect(() => {
    // F2.7: also attach on the native path once the plugin reports an unavailable
    // sensor — web 'deviceorientation' is the fallback (same flow as iOS permission).
    if (canUseNativeArTracking() && !webFallbackNeeded) return;
    let supported = false;
    let hasAbsoluteListenerFired = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      supported = true;
      if (sensorStatusRef.current !== 'active') {
        setSensorStatusIfChanged('active');
      }

      const orientationEvent = e as DeviceOrientationWithCompass;
      if (hasAbsoluteListenerFired && !orientationEvent.absolute) return;
      if (!orientationEvent.absolute && 'ondeviceorientationabsolute' in window) return;

      let alpha = e.alpha ?? 0;
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;

      const webkitHeading = orientationEvent.webkitCompassHeading;
      if (webkitHeading !== undefined && webkitHeading !== null) {
        alpha = (360 - webkitHeading) % 360;
        setAbsoluteHeadingIfChanged(true);
      }

      orientationRef.current = { alpha, beta, gamma, matrix: null, declination: 0, source: 'web' };
    };

    const handleOrientationAbsolute = (e: DeviceOrientationEvent) => {
      supported = true;
      hasAbsoluteListenerFired = true;
      setAbsoluteHeadingIfChanged(true);
      if (sensorStatusRef.current !== 'active') {
        setSensorStatusIfChanged('active');
      }
      orientationRef.current = {
        alpha: e.alpha ?? 0,
        beta: e.beta ?? 0,
        gamma: e.gamma ?? 0,
        matrix: null,
        declination: 0,
        source: 'web',
      };
    };

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as DeviceOrientationEventConstructorWithPermission).requestPermission === 'function'
    ) {
      if (!iosPermissionGranted) {
        setSensorStatusIfChanged('requires-interaction');
        return;
      }
    }

    window.addEventListener('deviceorientationabsolute', handleOrientationAbsolute, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    const timeoutId = setTimeout(() => {
      if (!supported) {
        setSensorStatusIfChanged('not-supported');
        orientationRef.current = {
          alpha: 180,
          beta: 75,
          gamma: 0,
          matrix: null,
          declination: 0,
          source: 'web',
        };
      }
    }, 1200);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('deviceorientationabsolute', handleOrientationAbsolute, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [webFallbackNeeded, iosPermissionGranted, setSensorStatusIfChanged, setAbsoluteHeadingIfChanged]);

  const requestIosPermission = async () => {
    try {
      const requestPermission = (DeviceOrientationEvent as DeviceOrientationEventConstructorWithPermission).requestPermission;
      if (!requestPermission) return;
      const res = await requestPermission();
      if (res === 'granted') {
        setSensorStatusIfChanged('checking');
        setIosPermissionGranted(true);
      } else {
        setSensorStatusIfChanged('denied');
      }
    } catch (err) {
      setSensorStatusIfChanged('not-supported');
    }
  };

  return {
    sensorStatus,
    requestIosPermission,
    orientationRef,
    calibSuccess,
    showCalibWizard,
    setShowCalibWizard,
    startCalibration,
    calibProgress,
    rollProgress,
    pitchProgress,
    trackingQuality: getTrackingQuality(sensorStatus, absoluteHeading, calibSuccess, nativeAccuracy),
  };
};
