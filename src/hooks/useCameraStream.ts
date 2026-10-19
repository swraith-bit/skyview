import { RefObject, useEffect, useRef, useState } from 'react';

export type CameraPermissionState = 'idle' | 'granted' | 'denied';

// F2.6: startup failures must be classified so the AR map can show a matching
// message instead of always claiming "sensor denied", and so AbortError stays silent.
export type CameraErrorCode = 'denied' | 'busy' | 'missing' | 'aborted' | 'unknown';

export const classifyCameraError = (error: unknown): CameraErrorCode => {
  const name = typeof error === 'object' && error !== null
    ? String((error as { name?: unknown }).name ?? '')
    : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'denied';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'busy';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'missing';
    case 'AbortError':
      return 'aborted';
    default:
      return 'unknown';
  }
};

export interface CameraStreamState {
  playing: boolean;
  width: number;
  height: number;
  permissionState: CameraPermissionState;
  errorCode: CameraErrorCode | null;
}

export const useCameraStream = (
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onError: (error: unknown) => void,
): CameraStreamState => {
  const [state, setState] = useState<CameraStreamState>({
    playing: false,
    width: 0,
    height: 0,
    permissionState: 'idle',
    errorCode: null,
  });

  // F2.6: onError lives in a ref so changing its identity (e.g. switching the
  // AR language) does not tear down and restart the running camera stream.
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const video = videoRef.current;
    let stream: MediaStream | null = null;
    let disposed = false;
    const stop = () => {
      setState(previous => ({ ...previous, playing: false }));
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    };
    if (!enabled || !video) {
      stop();
      return stop;
    }
    const updateDimensions = () => {
      setState(previous => ({
        ...previous,
        width: video.videoWidth || previous.width,
        height: video.videoHeight || previous.height,
      }));
    };
    const onPlaying = () => {
      updateDimensions();
      setState(previous => ({ ...previous, playing: true, permissionState: 'granted' }));
    };
    video.addEventListener('playing', onPlaying);
    video.addEventListener('loadedmetadata', updateDimensions);
    // F2.6: the video element fires resize whenever the stream dimensions change,
    // including when the device orientation flips the stream format. Keeping these
    // fresh prevents the effective FOV from being computed with stale dimensions.
    video.addEventListener('resize', updateDimensions);
    const start = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
          try {
            const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
            if (!disposed && status.state === 'denied') {
              setState(previous => ({ ...previous, permissionState: 'denied' }));
            }
          } catch {
            // Permissions API may not support 'camera' in all WebViews; proceed to getUserMedia.
          }
        }
        const next = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (disposed) {
          next.getTracks().forEach(track => track.stop());
          return;
        }
        stream = next;
        setState(previous => ({ ...previous, permissionState: 'granted' }));
        video.srcObject = next;
        try {
          await video.play();
        } catch (playError) {
          // F2.6: play() rejects with AbortError when playback is interrupted
          // by the stream being replaced or the element being paused; that is
          // benign and must not be reported as a denied permission.
          if (classifyCameraError(playError) === 'aborted') {
            return;
          }
          throw playError;
        }
      } catch (error) {
        if (!disposed) {
          const code = classifyCameraError(error);
          setState(previous => ({
            ...previous,
            playing: false,
            errorCode: code,
            // Only a real permission rejection marks the permission state; a busy
            // or missing camera keeps the previous probe result.
            permissionState: code === 'denied' ? 'denied' : previous.permissionState,
          }));
          onErrorRef.current(error);
        }
      }
    };
    void start();
    return () => {
      disposed = true;
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('loadedmetadata', updateDimensions);
      video.removeEventListener('resize', updateDimensions);
      stop();
    };
  }, [enabled, videoRef]);

  return state;
};
