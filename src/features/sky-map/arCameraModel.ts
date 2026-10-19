import { NativeCameraModel, RotationMatrix3 } from '../../native/skyArTracking';

export const DEFAULT_HORIZONTAL_FOV = 55;

const toRadians = (degrees: number) => degrees * Math.PI / 180;
const toDegrees = (radians: number) => radians * 180 / Math.PI;
const fovFromTangent = (value: number) => toDegrees(2 * Math.atan(value));

const isValidDimension = (value: number | undefined): value is number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0
);

export const calculateEffectiveHorizontalFov = (
  model: NativeCameraModel | null,
  streamWidth: number,
  streamHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): number => {
  if (
    !model
    || !isValidDimension(model.horizontalFov)
    || !isValidDimension(model.verticalFov)
    || !isValidDimension(model.sensorWidth)
    || !isValidDimension(model.sensorHeight)
    || !isValidDimension(streamWidth)
    || !isValidDimension(streamHeight)
    || !isValidDimension(viewportWidth)
    || !isValidDimension(viewportHeight)
  ) return DEFAULT_HORIZONTAL_FOV;

  const isStreamRotated = (streamWidth < streamHeight) !== (model.sensorWidth < model.sensorHeight);
  const effectiveSensorWidth = isStreamRotated ? model.sensorHeight : model.sensorWidth;
  const effectiveSensorHeight = isStreamRotated ? model.sensorWidth : model.sensorHeight;
  const effectiveSensorHFov = isStreamRotated ? model.verticalFov : model.horizontalFov;
  const effectiveSensorVFov = isStreamRotated ? model.horizontalFov : model.verticalFov;

  const sensorAspect = effectiveSensorWidth / effectiveSensorHeight;
  const streamAspect = streamWidth / streamHeight;
  const viewportAspect = viewportWidth / viewportHeight;
  const fullHorizontalTangent = Math.tan(toRadians(effectiveSensorHFov) / 2);
  const fullVerticalTangent = Math.tan(toRadians(effectiveSensorVFov) / 2);

  // Camera outputs narrower than the sensor generally crop the horizontal axis.
  const streamHorizontalTangent = streamAspect < sensorAspect
    ? fullVerticalTangent * streamAspect
    : fullHorizontalTangent;

  // CSS object-fit: cover crops the horizontal axis when the viewport is narrower.
  const visibleHorizontalFraction = viewportAspect < streamAspect
    ? viewportAspect / streamAspect
    : 1;
  const effective = fovFromTangent(streamHorizontalTangent * visibleHorizontalFraction);
  return Math.min(120, Math.max(20, effective));
};

export const normalizeAzimuth = (degrees: number): number => ((degrees % 360) + 360) % 360;

export const convertTrueToTrackingAzimuth = (
  trueAzimuth: number,
  magneticDeclination: number,
  manualOffset: number,
): number => normalizeAzimuth(trueAzimuth - magneticDeclination - manualOffset);

export const calculateAngularDistance = (
  targetAzimuth: number,
  centerAzimuth: number,
): number => {
  const normTarget = normalizeAzimuth(targetAzimuth);
  const normCenter = normalizeAzimuth(centerAzimuth);
  const diff = Math.abs(normTarget - normCenter);
  return diff > 180 ? 360 - diff : diff;
};

/**
 * F6.4 — Ekran merkezindeki görüş ekseninin gerçek (true) azimutunu döndürür.
 *
 * Native izleme, dönüştürülmüş bir matris verir (tracking çerçevesi:
 * true − declination − manualOffset). Matrize bakan merkez-eksen formülü
 * ARSkyMap radar hedefleme mantığıyla aynıdır: telefon tam yukarı/aşağı
 * bakarken (r13/r23 ≈ 0) azimut tanımsızdır ve yaw (alpha) yoluna düşer.
 * Web yolunda `alpha` zaten yaklaşık-true başlık kabul edilir.
 */
export const computeCameraTrueHeadingDeg = (
  nativeMatrix: RotationMatrix3 | null,
  alpha: number,
  magneticDeclination: number,
  manualOffset: number,
): number => {
  if (nativeMatrix && nativeMatrix.length >= 9) {
    const r13 = Number(nativeMatrix[2]);
    const r23 = Number(nativeMatrix[5]);
    if (Number.isFinite(r13) && Number.isFinite(r23) && Math.hypot(r13, r23) > 1e-4) {
      return normalizeAzimuth((Math.atan2(-r13, -r23) * 180) / Math.PI + magneticDeclination + manualOffset);
    }
  }
  return normalizeAzimuth(alpha + manualOffset);
};
