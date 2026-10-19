import React, { useEffect, useRef, useState, useMemo } from 'react';
import { t } from '../../i18n';
import { HourlyData } from '../../types';
import { stars, Star, constellations, dsoList, DSO } from '../../data/celestialData';
import { getEveningSunTimes, getMoonPhase } from '../../utils/astronomy';
import { getCompassLabels } from '../../utils/compassLabels';
import { Body, Equator, Horizon, Illumination, MakeTime, Observer } from 'astronomy-engine';
import { lockHaptic, selectionHaptic } from '../../utils/haptics';
import {
  Camera, 
  Compass, 
  Search, 
  Clock, 
  X, 
  Sparkles, 
  Sunset,
  AlertCircle,
  Wind,
  SlidersHorizontal,
  Star as StarIcon,
  Download,
  Grid3x3,
  Navigation,
  Orbit
} from 'lucide-react';
import { useCompass } from '../../hooks/useCompass';
import { useAppStore } from '../../store/useAppStore';
import { planetNames, getLocalizedDescription } from '../../data/celestialDescriptions';
import { useCameraStream, classifyCameraError } from '../../hooks/useCameraStream';
import { CelestialTarget, getArTranslation as getTranslation, getTargetAlt, getTargetAz, getTargetDisplayName, getTargetDisplayType, getTargetDistance, getTargetId, getTargetMagnitude, ProjectedBody, RenderedBody } from './arTargets';
import { productT } from '../../i18nProduct';
import { drawConstellationArtwork, drawMoonPhase } from './arArtwork';
import { calculateAstroPhotoWindow, formatGuideTime } from './arPhotoGuide';
import {
  calculateAngularDistance,
  calculateEffectiveHorizontalFov,
  computeCameraTrueHeadingDeg,
  convertTrueToTrackingAzimuth,
  DEFAULT_HORIZONTAL_FOV,
} from './arCameraModel';
import { ArHudStrip } from './ArHudStrip';
import { getNativeCameraModel, NativeCameraModel } from '../../native/skyArTracking';
import type { ArGpuScene, GpuBody, GpuConstellationLine, GpuSkyPoint } from './arGpuScene';
import { getCurrentArQualityProfile } from './arExperience';
import { buildCelestialEquatorGuide, buildEclipticGuide, GuideSegment } from './arSkyGuides';
import { appStorage } from '../../repositories/storageRepository';
import { readArSessions, saveArSession } from '../../repositories/arSessionRepository';
import { recordPerformanceMetric } from '../../utils/performanceMonitor';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { StandardModal } from '../../components/ui/Modal';

interface ARSkyMapProps {
  hourly: HourlyData | null;
}

// noUncheckedIndexedAccess: Record indekslemesi string|undefined döndürür ama
// veri modeli her names kaydında 'en' anahtarını garanti eder (celestialData.ts);
// sondaki '' yalnızca bu garanti reddedildiğinde devreye girer.
const pickDisplayName = (names: Record<string, string>, lang: string): string => names[lang] || names.en || '';

// F3.3: static body list hoisted out of the frame loop entirely — the entries
// never change, only their coordinates do (previously rebuilt on every 1 Hz
// cache refresh inside the render closure).
const CELESTIAL_BODIES: RenderedBody[] = [
  { id: Body.Sun, key: 'Sun', color: '#ffd000', size: 18 },
  { id: Body.Moon, key: 'Moon', color: '#ffffff', size: 14 },
  { id: Body.Mercury, key: 'Mercury', color: '#888888', size: 6.5 },
  { id: Body.Venus, key: 'Venus', color: '#e3bb76', size: 9 },
  { id: Body.Mars, key: 'Mars', color: '#c65a3b', size: 7.5 },
  { id: Body.Jupiter, key: 'Jupiter', color: '#d8a070', size: 13 },
  { id: Body.Saturn, key: 'Saturn', color: '#e2bf7d', size: 11 },
  { id: Body.Uranus, key: 'Uranus', color: '#a2e1e7', size: 8 },
  { id: Body.Neptune, key: 'Neptune', color: '#3f54ba', size: 8 }
];

// F3.3 (§4.5 leftover): the twinkle phase derives from the star's identity
// instead of its position in the visible set, so phases no longer jump when the
// visible star set changes (stars rise/set, battery-saver filtering) or when
// the render effect re-creates its random phase table (e.b. language change).
const starTwinklePhase = (id: string): number => {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return ((hash % 3600) / 3600) * Math.PI * 2;
};

export const ARSkyMap: React.FC<ARSkyMapProps> = ({ hourly }) => {
  // F2.2: fieldMode is wired into the AR red-vision pipeline (GPU nightvisor +
  // container background) and softens the app-wide red overlay while AR is open.
  const { lang, currentLocation, nightMode, fieldMode } = useAppStore();
 const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gpuSceneRef = useRef<ArGpuScene | null>(null);
  const arQualityProfileRef = useRef(getCurrentArQualityProfile());
  const arSessionStartedAtRef = useRef<number | null>(null);
  // F6.4: HUD azimut metnini kare-döngü imperatif yazar; React state'i değildir.
  const hudHeadingTextRef = useRef<HTMLSpanElement | null>(null);
  // F6.1: kuzeye hizalanınca tek mikro klik; kuzeyden uzaklaşmadan tekrar etmez.
  const northHapticArmedRef = useRef(false);

 // States
 const [arMode, setArMode] = useState<boolean>(false);
 
 const {
   sensorStatus,
   requestIosPermission,
   orientationRef,
   calibSuccess,
   showCalibWizard,
   setShowCalibWizard,
   startCalibration,
   calibProgress: totalProgress,
   rollProgress,
    pitchProgress,
    trackingQuality,
  } = useCompass(currentLocation.latitude, currentLocation.longitude);

 const [showArtwork, setShowArtwork] = useState<boolean>(true);
 const showArtworkRef = useRef<boolean>(showArtwork);
 useEffect(() => {
   showArtworkRef.current = showArtwork;
 }, [showArtwork]);
 // F2.1: layer toggles driving the scene-controls panel; the refs below are read
 // by the render loop so toggling does not restart the animation loop.
 const [showGrid, setShowGrid] = useState<boolean>(true);
 const showGridRef = useRef<boolean>(showGrid);
 useEffect(() => {
   showGridRef.current = showGrid;
 }, [showGrid]);
 const [showEcliptic, setShowEcliptic] = useState<boolean>(true);
 const showEclipticRef = useRef<boolean>(showEcliptic);
 useEffect(() => {
   showEclipticRef.current = showEcliptic;
 }, [showEcliptic]);
 const [showCelestialEquator, setShowCelestialEquator] = useState<boolean>(false);
 const showCelestialEquatorRef = useRef<boolean>(showCelestialEquator);
 useEffect(() => {
   showCelestialEquatorRef.current = showCelestialEquator;
 }, [showCelestialEquator]);
 const [toastMsg, setToastMsg] = useState<string | null>(null);
 // F2.6: startup failures map to the real cause (denied / busy / missing) instead
 // of always reporting "sensor denied"; AbortError from play() stays silent.
 const handleCameraError = React.useCallback((error: unknown) => {
   console.error('Camera stream startup failed:', error);
   const code = classifyCameraError(error);
   if (code === 'aborted') return;
   setArMode(false);
   setToastMsg(getTranslation(
     code === 'denied' ? 'sensorDenied'
       : code === 'busy' ? 'cameraBusy'
         : code === 'missing' ? 'cameraMissing'
           : 'cameraStartFailed',
     lang,
   ));
 }, [lang]);
 const cameraStream = useCameraStream(videoRef, arMode, handleCameraError);
 const videoPlaying = cameraStream.playing;
 const [nativeCameraModel, setNativeCameraModel] = useState<NativeCameraModel | null>(null);
  const [gpuRendererAvailable, setGpuRendererAvailable] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => appStorage.getJson('skyview_favorite_targets', []));
  const [recentSessionCount, setRecentSessionCount] = useState(() => readArSessions().length);

  useEffect(() => {
    if (nativeCameraModel?.available) return;
    if (arMode && !videoPlaying && cameraStream.permissionState !== 'granted') return;
    let disposed = false;
    void getNativeCameraModel().then(model => {
      if (!disposed && model) setNativeCameraModel(model);
    });
    return () => { disposed = true; };
  }, [arMode, videoPlaying, cameraStream.permissionState, nativeCameraModel?.available]);

  useEffect(() => {
    const canvas = webglCanvasRef.current;
    if (!canvas) return;
    let disposed = false;
    void import('./arGpuScene').then(({ ArGpuScene: GpuScene }) => {
      if (disposed) return;
      try {
        gpuSceneRef.current = new GpuScene(canvas);
        setGpuRendererAvailable(true);
      } catch (error) {
        console.warn('GPU AR renderer unavailable, continuing with Canvas fallback.', error);
        gpuSceneRef.current = null;
        setGpuRendererAvailable(false);
      }
    }).catch(error => {
      if (!disposed) {
        console.warn('GPU AR renderer failed to load, continuing with Canvas fallback.', error);
        setGpuRendererAvailable(false);
      }
    });
    return () => {
      disposed = true;
      gpuSceneRef.current?.dispose();
      gpuSceneRef.current = null;
    };
 }, []);

 useEffect(() => {
 if (toastMsg) {
 const timer = setTimeout(() => setToastMsg(null), 3000);
 return () => clearTimeout(timer);
 }
  }, [toastMsg]);

  useEffect(() => {
    if (!arMode) return;
    arSessionStartedAtRef.current = Date.now();
    return () => {
      const startedAt = arSessionStartedAtRef.current;
      arSessionStartedAtRef.current = null;
      if (!startedAt) return;
      const endedAt = Date.now();
      const durationSeconds = Math.round((endedAt - startedAt) / 1000);
      if (durationSeconds < 5) return;
      saveArSession({
        startedAt,
        endedAt,
        durationSeconds,
        targetId: getTargetId(selectedTargetRef.current) ?? undefined,
      });
      setRecentSessionCount(readArSessions().length);
    };
  }, [arMode]);
 
 // HUD selection
 const [selectedTarget, setSelectedTarget] = useState<CelestialTarget | null>(null);
 const selectedTargetRef = useRef<CelestialTarget | null>(null);
 selectedTargetRef.current = selectedTarget;
 const [searchTargetId, setSearchTargetId] = useState<string | null>(null); // For active arrow navigation
 const [showSearch, setShowSearch] = useState<boolean>(false);
 const [searchQuery, setSearchQuery] = useState<string>('');
 
 // Custom offsets
 const [calibrationOffset, setCalibrationOffset] = useState<number>(0); // manual azimuth adjustment in degrees
 const [timeTravelHours, setTimeTravelHours] = useState<number>(0); // hours offset from current time
  const [showTimeTravel, setShowTimeTravel] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false); // Photo Guide Drawer
  const [showSceneControls, setShowSceneControls] = useState<boolean>(false);
  // F5.4: modal kabığı (odak tuzağı, ESC, aria-modal, gövde kaydırma kilidi,
  // AnimatePresence çıkışı) StandardModal'da; eski ref + useFocusTrap çiftleri bitti.
  // F5.3: modal olmayan overlay'ler (foto kılavuzu çekmecesi) geri tuşu yığınına kaydolur.
  useModalBackHandler(showGuide, () => setShowGuide(false));
  useModalBackHandler(showTimeTravel, () => setShowTimeTravel(false));

  const toggleFavoriteTarget = (targetId: string) => {
    const isFavorite = favorites.includes(targetId);
    const next = isFavorite
      ? favorites.filter(id => id !== targetId)
      : [...favorites, targetId];
    setFavorites(next);
    appStorage.setJson('skyview_favorite_targets', next);
    // F2.8: favoriting no longer hijacks the radar navigation; the detail card
    // exposes a dedicated guide button for that.
  };

  const captureArView = async () => {
    const overlay = canvasRef.current;
    if (!overlay) return;
    try {
      const composite = document.createElement('canvas');
      composite.width = overlay.width;
      composite.height = overlay.height;
      const context = composite.getContext('2d');
      if (!context) throw new Error('Capture canvas unavailable');
      context.fillStyle = '#020617';
      context.fillRect(0, 0, composite.width, composite.height);
      if (arMode && videoRef.current && videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        // F1.4: reproduce the CSS object-fit: cover crop so the captured video layer
        // matches what the user sees on screen.
        const video = videoRef.current;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (vw > 0 && vh > 0) {
          const coverScale = Math.max(composite.width / vw, composite.height / vh);
          const sourceWidth = composite.width / coverScale;
          const sourceHeight = composite.height / coverScale;
          const sourceX = (vw - sourceWidth) / 2;
          const sourceY = (vh - sourceHeight) / 2;
          context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, composite.width, composite.height);
        }
      }
      if (webglCanvasRef.current) context.drawImage(webglCanvasRef.current, 0, 0, composite.width, composite.height);
      context.drawImage(overlay, 0, 0, composite.width, composite.height);
      const blob = await new Promise<Blob | null>(resolve => composite.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Capture encoding failed');
      const file = new File([blob], `skyview-ar-${Date.now()}.png`, { type: 'image/png' });
      const canShare = navigator.canShare?.({ files: [file] }) ?? false;
      if (canShare && navigator.share) {
        await navigator.share({ files: [file], title: 'SkyView AR' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setToastMsg(getTranslation('captureReady', lang));
    } catch (error) {
      console.warn('AR capture failed:', error);
      setToastMsg(getTranslation('captureFailed', lang));
    }
  };

 // References for render loop (avoids stale state in loop closure)
 const smoothedOrientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
 const touchStartRef = useRef<{ x: number; time: number } | null>(null);
 const dismissedTargetIdRef = useRef<string | null>(null);

 // Refs to avoid tearing down render loop on state/prop changes
 const arModeRef = useRef(arMode);
 const calibrationOffsetRef = useRef(calibrationOffset);
 const timeTravelHoursRef = useRef(timeTravelHours);
 const langRef = useRef(lang);
 const searchTargetIdRef = useRef(searchTargetId);
 const currentLocationRef = useRef(currentLocation);
 const nightModeRef = useRef(nightMode);
 const fieldModeRef = useRef(fieldMode);
 const cameraModelRef = useRef(nativeCameraModel);
 const cameraStreamRef = useRef(cameraStream);

 // Sync refs with states/props on every render
 useEffect(() => { arModeRef.current = arMode; }, [arMode]);
 useEffect(() => { calibrationOffsetRef.current = calibrationOffset; }, [calibrationOffset]);
 useEffect(() => { timeTravelHoursRef.current = timeTravelHours; }, [timeTravelHours]);
 useEffect(() => { langRef.current = lang; }, [lang]);
 useEffect(() => { searchTargetIdRef.current = searchTargetId; }, [searchTargetId]);
 useEffect(() => { currentLocationRef.current = currentLocation; }, [currentLocation]);
 useEffect(() => { nightModeRef.current = nightMode; }, [nightMode]);
 useEffect(() => { fieldModeRef.current = fieldMode; }, [fieldMode]);
 useEffect(() => { cameraModelRef.current = nativeCameraModel; }, [nativeCameraModel]);
 useEffect(() => { cameraStreamRef.current = cameraStream; }, [cameraStream]);

 // F2.2: the app-wide red overlay and video filter (night-mode-active) would
 // double-tint the AR scene, which already applies its own GPU night vision.
 // Marking the document while the AR view is open softens both (see index.css),
 // and keeps the F1.4 capture flow compositing the unfiltered camera feed.
 useEffect(() => {
   if (typeof document === 'undefined') return;
   document.documentElement.classList.toggle('skyview-ar-open', arMode);
   return () => document.documentElement.classList.remove('skyview-ar-open');
 }, [arMode]);

 // Constants
 const lerpFactor = 0.12; // Lower is smoother (low-pass filter coefficient)


 // 4. Manual Calibration drag gestures (drag left/right on canvas to tweak azimuth heading)
 const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
 if (e.touches.length === 1) {
 const touch = e.touches[0]; // noUnchecked: length===1 guard'ı ilk dokunuşın varlığını garanti eder
 if (touch) touchStartRef.current = { x: touch.clientX, time: Date.now() };
 }
 };

 const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
 const touch = e.touches[0]; // noUnchecked: length===1 guard'ı ilk dokunuşın varlığını garanti eder
 if (touchStartRef.current && e.touches.length === 1 && touch) {
 const deltaX = touch.clientX - touchStartRef.current.x;
 // Convert pixel delta to heading adjustment degrees
 const sens = 0.15; // sensitivity
 setCalibrationOffset(prev => (prev - deltaX * sens + 360) % 360);
 touchStartRef.current.x = touch.clientX; // refresh start
 }
 };

 const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
 touchStartRef.current = { x: e.clientX, time: Date.now() };
 };

 const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
 if (touchStartRef.current && e.buttons === 1) {
 const deltaX = e.clientX - touchStartRef.current.x;
 const sens = 0.15;
 setCalibrationOffset(prev => (prev - deltaX * sens + 360) % 360);
 touchStartRef.current.x = e.clientX;
 }
 };

 const handleMouseUpOrLeave = () => {
 touchStartRef.current = null;
 };

 // 5. Main Canvas Stargazing Render loop
useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 let animationFrameId: number;
 let isVisible = true;
 let isDestroyed = false;
 let lastFrameTime = 0;
 // F6.4: son yazılan HUD azimut derecesi — değer değişmediyse textContent'e
 // yazılmaz (DOM churn olmadan canlı azimut).
 let lastHudHeadingDeg = -1;
 const handleVisibilityChange = () => {
 isVisible = !document.hidden;
 if (isVisible && !isDestroyed) {
 animationFrameId = requestAnimationFrame(render);
 } else {
 cancelAnimationFrame(animationFrameId);
 }
 };
 document.addEventListener('visibilitychange', handleVisibilityChange);

 const handleResize = () => {
 const parent = canvas.parentElement;
 const cssWidth = parent?.clientWidth || window.innerWidth;
 const cssHeight = parent?.clientHeight || window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, arQualityProfileRef.current.maxDpr);
 
 const newWidth = Math.floor(cssWidth * dpr);
 const newHeight = Math.floor(cssHeight * dpr);
 
 if (canvas.width !== newWidth || canvas.height !== newHeight) {
 canvas.width = newWidth;
 canvas.height = newHeight;
 canvas.style.width = `${cssWidth}px`;
 canvas.style.height = `${cssHeight}px`;
 }
 };
 window.addEventListener('resize', handleResize);
 handleResize();

 // F3.3: one 2d context for the whole effect lifetime instead of one lookup
 // per frame. The context survives canvas backing-store resizes.
 const ctx = canvas.getContext('2d');

  let lastCacheTime = 0;
  // F2.5: the 1 Hz az/alt cache must also invalidate when the time-travel offset
  // changes, otherwise +/-120h jumps keep rendering stale sky coordinates.
  let cachedTimeTravelHours = timeTravelHoursRef.current;
  // F3.3: Observer/AstroTime are rebuilt only inside the 1 Hz window (and on
  // time-travel offset changes) — never per frame. Initialized eagerly so the
  // first frame and radar lookups always have valid instances.
  let cachedObserver = new Observer(currentLocationRef.current.latitude, currentLocationRef.current.longitude, 0);
  let cachedAstroTime = MakeTime(new Date(Date.now() + timeTravelHoursRef.current * 3600000));
  const fpsSampleStart = performance.now();
  let fpsSampleFrames = 0;
  let fpsRecorded = false;
 const cachedStarsMap: Record<string, { s: Star; az: number; alt: number }> = {};
 const cachedDsoMap: Record<string, { d: DSO; az: number; alt: number }> = {};
 const cachedBodiesMap: Record<string, { body: RenderedBody; az: number; alt: number; key: string; dist: number; mag: number }> = {};
 // F2.1: az/alt rings for the ecliptic and the celestial equator, recomputed with
 // the same 1 Hz (and F2.5 time-travel-aware) cadence as the body coordinates.
 let cachedGuideRings: { ecliptic: GuideSegment[]; celestialEquator: GuideSegment[] } | null = null;


 const render = (frameTime: number) => {
 if (isDestroyed) return;
 if (!isVisible) return;
  if (frameTime - lastFrameTime < arQualityProfileRef.current.minFrameIntervalMs) {
 animationFrameId = requestAnimationFrame(render);
 return;
 }
  lastFrameTime = frameTime;
  fpsSampleFrames += 1;
  if (!fpsRecorded && frameTime - fpsSampleStart >= 2000) {
    recordPerformanceMetric('ar-render-fps', (fpsSampleFrames * 1000) / (frameTime - fpsSampleStart));
    fpsRecorded = true;
  }
 if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, arQualityProfileRef.current.maxDpr);
 ctx.save();
 ctx.scale(dpr, dpr);

 const w = canvas.width / dpr;
 const h = canvas.height / dpr;
 const cx = w / 2;
 const cy = h / 2;

 ctx.clearRect(0, 0, w, h);

 // Check Red Mode (F2.2: night mode or field/observing mode both drive AR red vision)
 const isRedMode = nightModeRef.current || fieldModeRef.current;

  const gpuScene = gpuSceneRef.current;

  // Canvas fallback keeps the old backdrop only when WebGL is unavailable.
  if (!arModeRef.current && !gpuScene) {
 // Deep Space nebula gradients
 const skyGradient = ctx.createRadialGradient(cx, cy * 1.5, Math.min(w, h) * 0.1, cx, cy, Math.max(w, h));
 if (isRedMode) {
 skyGradient.addColorStop(0, '#0f0000');
 skyGradient.addColorStop(0.5, '#050000');
 skyGradient.addColorStop(1, '#000000');
 } else {
 skyGradient.addColorStop(0, '#060a1f');
 skyGradient.addColorStop(0.4, '#030510');
 skyGradient.addColorStop(1, '#000000');
 }
 ctx.fillStyle = skyGradient;
 ctx.fillRect(0, 0, w, h);

 // Draw virtual background stars (random non-celestial static stars for space texture)
 ctx.fillStyle = isRedMode ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.2)';
 for (let i = 0; i < 60; i++) {
 const sx = (Math.sin(i * 352.3) * 0.5 + 0.5) * w;
 const sy = (Math.cos(i * 123.7) * 0.5 + 0.5) * h;
 ctx.beginPath();
 ctx.arc(sx, sy, 0.7, 0, Math.PI * 2);
 ctx.fill();
 }
 }

 // Smooth web orientation. Native Android tracking already provides a fused matrix.
 const target = orientationRef.current;
 const current = smoothedOrientationRef.current;
 let r11: number, r12: number, r13: number;
 let r21: number, r22: number, r23: number;
 let r31: number, r32: number, r33: number;
 const nativeMatrix = target.source === 'native' ? target.matrix : null;

 if (nativeMatrix) {
   [r11, r12, r13, r21, r22, r23, r31, r32, r33] = nativeMatrix;
 } else {
   let diffAlpha = target.alpha - current.alpha;
   if (diffAlpha < -180) diffAlpha += 360;
   if (diffAlpha > 180) diffAlpha -= 360;
   current.alpha = (current.alpha + diffAlpha * lerpFactor + 360) % 360;
   current.beta += (target.beta - current.beta) * lerpFactor;
   current.gamma += (target.gamma - current.gamma) * lerpFactor;

   const adjustedYaw = (current.alpha + calibrationOffsetRef.current + 360) % 360;
   const a = adjustedYaw * Math.PI / 180;
   const b = current.beta * Math.PI / 180;
   const g = current.gamma * Math.PI / 180;
   const ca = Math.cos(a), sa = Math.sin(a);
   const cb = Math.cos(b), sb = Math.sin(b);
   const cg = Math.cos(g), sg = Math.sin(g);

   r11 = ca * cg - sa * sb * sg;
   r12 = -sa * cb;
   r13 = ca * sg + sa * sb * cg;
   r21 = sa * cg + ca * sb * sg;
   r22 = ca * cb;
   r23 = sa * sb - ca * sb * cg;
   r31 = -cb * sg;
   r32 = sb;
   r33 = cb * cg;
 }

 // Retrieve screen orientation rotation angle. F2.4: standardize on
 // screen.orientation.angle; window.orientation is deprecated, and both carry
 // the same meaning for the cos/sin rotation below (which normalize ±quarter turns).
 const orientationAngle = screen.orientation?.angle ?? (typeof window.orientation === 'number' ? window.orientation : 0);
 const screenAngle = orientationAngle * Math.PI / 180;
 const cosSA = Math.cos(screenAngle);
 const sinSA = Math.sin(screenAngle);

 // F6.4: HUD azimutu — merkez görüş ekseninin true azimutu; yalnızca derece
 // değiştiğinde imperatif olarak yazılır (kare hızıyla DOM churn yok).
 const hudHeadingEl = hudHeadingTextRef.current;
 if (hudHeadingEl) {
   const hudHeadingDeg = Math.round(computeCameraTrueHeadingDeg(
     nativeMatrix,
     current.alpha,
     target.declination,
     calibrationOffsetRef.current,
   ));
   if (hudHeadingDeg !== lastHudHeadingDeg) {
     lastHudHeadingDeg = hudHeadingDeg;
     hudHeadingEl.textContent = String(hudHeadingDeg);
     const northDelta = Math.min(hudHeadingDeg, 360 - hudHeadingDeg);
     if (northDelta <= 2 && northHapticArmedRef.current) {
       northHapticArmedRef.current = false;
       void selectionHaptic();
     } else if (northDelta >= 8) {
       northHapticArmedRef.current = true;
     }
   }
 }

 // 3D to 2D screen coordinate projection helper
 const projectCoords = (azimuth: number, altitude: number, allowBehind = false) => {
 // az: 0 is North, increasing eastwards. alt: 0 is horizon, 90 is zenith
 const altRad = altitude * Math.PI / 180;
 const trackingAzimuth = nativeMatrix
   ? convertTrueToTrackingAzimuth(azimuth, target.declination, calibrationOffsetRef.current)
   : azimuth;
 const azRad = trackingAzimuth * Math.PI / 180;

 // V_world coordinates where X=East, Y=North, Z=Zenith
 const xw = Math.cos(altRad) * Math.sin(azRad);
 const yw = Math.cos(altRad) * Math.cos(azRad);
 const zw = Math.sin(altRad);

 // V_device = Transpose(R) * V_world
 const xd = r11 * xw + r21 * yw + r31 * zw;
 const yd = r12 * xw + r22 * yw + r32 * zw;
 const zd = r13 * xw + r23 * yw + r33 * zw;

 // check if behind screen (camera looks along -z)
 if (zd >= 0 && !allowBehind) return null;

 const stream = cameraStreamRef.current;
 const horizontalFov = arModeRef.current
   ? calculateEffectiveHorizontalFov(cameraModelRef.current, stream.width, stream.height, w, h)
   : DEFAULT_HORIZONTAL_FOV;
 const zoom = (w / 2) / Math.tan((horizontalFov * Math.PI / 180) / 2);
 
 const effZd = zd < 0 ? zd : -0.01;
 let dx = -(xd / -effZd) * zoom;
 let dy = -(yd / -effZd) * zoom;

 // If it is behind, scale it up to force border arrow navigation
 if (zd >= 0) {
 const length = Math.hypot(dx, dy) || 1;
 dx = (dx / length) * w * 5;
 dy = (dy / length) * h * 5;
 }

 // Rotate by screen orientation angle to support landscape
 const rx = dx * cosSA + dy * sinSA;
 const ry = -dx * sinSA + dy * cosSA;

 return { x: cx + rx, y: cy - ry };
 };

 // Set Observation Time & Precompute Az/Alt (Cached 1Hz for performance)
 const nowTs = Date.now();
 const observationTime = new Date(nowTs + timeTravelHoursRef.current * 3600000);

 const timeTravelOffset = timeTravelHoursRef.current;
 if (nowTs - lastCacheTime > 1000 || timeTravelOffset !== cachedTimeTravelHours) {
 lastCacheTime = nowTs;
 cachedTimeTravelHours = timeTravelOffset;

 // F3.3: Observer/AstroTime rebuild with the same 1 Hz cadence as the
 // coordinates they feed; frames between refreshes reuse cached instances.
 cachedObserver = new Observer(currentLocationRef.current.latitude, currentLocationRef.current.longitude, 0);
 cachedAstroTime = MakeTime(observationTime);
 const observer = cachedObserver;
 const makeTime = cachedAstroTime;

 stars.forEach(star => {
 const hor = Horizon(makeTime, observer, star.ra, star.dec, 'normal');
 cachedStarsMap[star.id] = { s: star, az: hor.azimuth, alt: hor.altitude };
 });

 dsoList.forEach(dso => {
 const hor = Horizon(makeTime, observer, dso.ra, dso.dec, 'normal');
 cachedDsoMap[dso.id] = { d: dso, az: hor.azimuth, alt: hor.altitude };
 });

 // F2.1: guide rings ride the same cache window as the body coordinates.
 cachedGuideRings = {
 ecliptic: buildEclipticGuide(makeTime, observer),
 celestialEquator: buildCelestialEquatorGuide(makeTime, observer),
 };

 // F3.3: the list itself is a module constant (CELESTIAL_BODIES); only the
 // coordinates are refreshed here.
 CELESTIAL_BODIES.forEach(item => {
 try {
 const eq = Equator(item.id, makeTime, observer, true, true);
 const hor = Horizon(makeTime, observer, eq.ra, eq.dec, 'normal');
 // Real topocentric distance (AU) and visual magnitude, refreshed with the same 1 Hz cache (F0.1, shared with F2.3).
 let mag: number;
 try {
 mag = Illumination(item.id, makeTime).mag;
 } catch {
 mag = Number.NaN;
 }
 cachedBodiesMap[item.key] = { body: item, az: hor.azimuth, alt: hor.altitude, key: item.key, dist: eq.dist, mag };
 } catch (e) {
 // ignore computation failure
 }
 });
 }

 // 6. Draw Alt-Az Coordinate Grid lines & Cardinal directions
 ctx.lineWidth = 1;
 ctx.strokeStyle = isRedMode ? 'rgba(100,0,0,0.15)' : 'rgba(99,102,241,0.18)';
 ctx.fillStyle = isRedMode ? 'rgba(239,68,68,0.7)' : 'rgba(199,210,254,0.7)';
 ctx.font = 'bold 11px monospace';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';

 // Cardinal labels (N, NE, ...) at horizon — always drawn; localized per lang (F5.6)
 const compassLabels = getCompassLabels(langRef.current);
 for (let azDeg = 0; azDeg < 360; azDeg += 45) {
 const labelPoint = projectCoords(azDeg, 0);
 if (labelPoint) {
 const idx = Math.round(azDeg / 45) % 8;
 const label = compassLabels[idx]; // getCompassLabels her zaman 8 etiket döndürür; guard yalnızca eksik veriye karşı
 if (label) ctx.fillText(label, labelPoint.x, labelPoint.y);
 }
 }

 // F2.1: the alt/az grid geometry (horizon circle, altitude rings, zenith
 // connection lines) honours the Izgara toggle.
 if (showGridRef.current) {
 for (let azDeg = 0; azDeg < 360; azDeg += 45) {
 const p1 = projectCoords(azDeg, 0);
 const p2 = projectCoords((azDeg + 45) % 360, 0);
 if (p1 && p2) {
 ctx.beginPath();
 ctx.moveTo(p1.x, p1.y);
 ctx.lineTo(p2.x, p2.y);
 ctx.stroke();
 }
 }

 // Altitude grids rings (30 deg and 60 deg levels)
 for (const gridAlt of [30, 60]) {
 for (let azDeg = 0; azDeg < 360; azDeg += 15) {
 const p1 = projectCoords(azDeg, gridAlt);
 const p2 = projectCoords((azDeg + 15) % 360, gridAlt);
 if (p1 && p2) {
 ctx.beginPath();
 ctx.moveTo(p1.x, p1.y);
 ctx.lineTo(p2.x, p2.y);
 ctx.stroke();
 }
 }
 }

 // Zenith connection lines
 for (let azDeg = 0; azDeg < 360; azDeg += 90) {
 for (let gridAlt = -60; gridAlt < 90; gridAlt += 15) {
 const p1 = projectCoords(azDeg, gridAlt);
 const p2 = projectCoords(azDeg, gridAlt + 15);
 if (p1 && p2) {
 ctx.beginPath();
 ctx.moveTo(p1.x, p1.y);
 ctx.lineTo(p2.x, p2.y);
 ctx.stroke();
 }
 }
 }
 }

 // F2.1: ecliptic & celestial equator rings, projected from az/alt line sets
 // cached in the 1 Hz window and toggled from the scene-controls panel.
 if (cachedGuideRings) {
 const drawGuideRing = (segments: GuideSegment[], strokeColor: string) => {
 ctx.strokeStyle = strokeColor;
 ctx.lineWidth = 1.4;
 ctx.setLineDash([7, 5]);
 segments.forEach(segment => {
 const p1 = projectCoords(segment.start.az, segment.start.alt);
 const p2 = projectCoords(segment.end.az, segment.end.alt);
 if (p1 && p2) {
 ctx.beginPath();
 ctx.moveTo(p1.x, p1.y);
 ctx.lineTo(p2.x, p2.y);
 ctx.stroke();
 }
 });
 ctx.setLineDash([]);
 };
 if (showEclipticRef.current) {
 drawGuideRing(cachedGuideRings.ecliptic, isRedMode ? 'rgba(239,68,68,0.45)' : 'rgba(251,191,36,0.55)');
 }
 if (showCelestialEquatorRef.current) {
 drawGuideRing(cachedGuideRings.celestialEquator, isRedMode ? 'rgba(239,68,68,0.3)' : 'rgba(96,165,250,0.5)');
 }
 }

 // 7. Calculate and Draw Constellation Lines (connections)
 const projectedStarsMap: Record<string, { x: number; y: number; s: Star; az: number; alt: number }> = {};
 // F3.3: flat projection lists feed the GPU/label/crosshair loops without the
 // per-frame Object.values/keys materialization.
 const projectedStarList: Array<{ x: number; y: number; s: Star; az: number; alt: number }> = [];
 stars.forEach(star => {
 const c = cachedStarsMap[star.id];
 if (!c) return;
 const proj = projectCoords(c.az, c.alt);
 if (proj) {
 const entry = { x: proj.x, y: proj.y, s: c.s, az: c.az, alt: c.alt };
 projectedStarsMap[star.id] = entry;
 projectedStarList.push(entry);
 }
 });

 // Project DSOs
 const projectedDsoMap: Record<string, { x: number; y: number; d: DSO; az: number; alt: number }> = {};
 const projectedDsoList: Array<{ x: number; y: number; d: DSO; az: number; alt: number }> = [];
 dsoList.forEach(dso => {
 const c = cachedDsoMap[dso.id];
 if (!c) return;
 const proj = projectCoords(c.az, c.alt);
 if (proj) {
 const entry = { x: proj.x, y: proj.y, d: c.d, az: c.az, alt: c.alt };
 projectedDsoMap[dso.id] = entry;
 projectedDsoList.push(entry);
 }
 });

  if (!gpuScene) {
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 4;
    ctx.shadowColor = isRedMode ? 'rgba(220,38,38,0.5)' : 'rgba(34,211,238,0.4)';
    ctx.strokeStyle = isRedMode ? 'rgba(220,38,38,0.25)' : 'rgba(34,211,238,0.35)';
    constellations.forEach(constell => {
      constell.connections.forEach(([starAId, starBId]) => {
        const ptA = projectedStarsMap[starAId];
        const ptB = projectedStarsMap[starBId];
        if (ptA && ptB) {
          ctx.beginPath();
          ctx.moveTo(ptA.x, ptA.y);
          ctx.lineTo(ptB.x, ptB.y);
          ctx.stroke();
        }
      });
    });
    ctx.shadowBlur = 0;
  }

  if (showArtworkRef.current) {
    constellations.forEach(constell => drawConstellationArtwork(ctx, constell.id, projectedStarsMap, isRedMode));
  }

  // 8. Canvas star fallback. The GPU layer owns stars when WebGL is available.
  if (!gpuScene) stars.forEach(star => {
 if (arQualityProfileRef.current.id === 'battery-saver' && star.mag > 2.8) return;
 const pt = projectedStarsMap[star.id];
 if (!pt) return;

 // Twinkle factor using cosine wave — F3.3: phase pinned to the star identity.
 const blinkPhase = starTwinklePhase(star.id) + nowTs / 600;
 const twinkleOpacity = 0.55 + Math.cos(blinkPhase * 1.5) * 0.45;

 // Size base mapping from magnitude
 const baseSize = Math.max(1, 4.5 - star.mag * 0.7);

 // Multi-layered star glow
 const glowRad = baseSize * (star.mag < 0 ? 5 : star.mag < 1.5 ? 3.5 : 2);
 const starGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowRad);
 
 if (isRedMode) {
 starGrad.addColorStop(0, `rgba(255, 60, 60, ${twinkleOpacity})`);
 starGrad.addColorStop(0.2, `rgba(239, 68, 68, ${twinkleOpacity * 0.7})`);
 starGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
 } else {
 // Color based on temperature roughly mapped to ID
 if (star.id === 'sirius' || star.id === 'vega') {
 starGrad.addColorStop(0, `rgba(220, 240, 255, ${twinkleOpacity})`);
 starGrad.addColorStop(0.15, `rgba(165, 220, 255, ${twinkleOpacity * 0.65})`);
 } else if (star.id === 'betelgeuse' || star.id === 'antares' || star.id === 'aldebaran') {
 starGrad.addColorStop(0, `rgba(255, 200, 180, ${twinkleOpacity})`);
 starGrad.addColorStop(0.15, `rgba(244, 63, 94, ${twinkleOpacity * 0.65})`); // red supergiant orange halo
 } else {
 starGrad.addColorStop(0, `rgba(255, 255, 255, ${twinkleOpacity})`);
 starGrad.addColorStop(0.15, `rgba(254, 243, 199, ${twinkleOpacity * 0.6})`);
 }
 starGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
 }

 ctx.beginPath();
 ctx.arc(pt.x, pt.y, glowRad, 0, Math.PI * 2);
 ctx.fillStyle = starGrad;
 ctx.fill();

 // White core dot
 ctx.beginPath();
 ctx.arc(pt.x, pt.y, Math.max(0.6, baseSize / 2), 0, Math.PI * 2);
 ctx.fillStyle = isRedMode ? '#ffb3b3' : '#ffffff';
 ctx.fill();

 // 4-Point flare sparkles for super bright stars (mag < 1.0)
 if (star.mag < 0.9) {
 ctx.strokeStyle = isRedMode ? `rgba(239,68,68,${twinkleOpacity * 0.45})` : `rgba(255,255,255,${twinkleOpacity * 0.45})`;
 ctx.lineWidth = 0.85;
 ctx.beginPath();
 // Horizontal flare
 ctx.moveTo(pt.x - baseSize * 3, pt.y);
 ctx.lineTo(pt.x + baseSize * 3, pt.y);
 // Vertical flare
 ctx.moveTo(pt.x, pt.y - baseSize * 3);
 ctx.lineTo(pt.x, pt.y + baseSize * 3);
 ctx.stroke();
 }

 // Draw names for very bright stars if close to screen center (within 120 pixels)
 const distToCenter = Math.hypot(pt.x - cx, pt.y - cy);
 if (star.mag < 1.5 && distToCenter < 140) {
 ctx.fillStyle = isRedMode ? 'rgba(239,68,68,0.7)' : 'rgba(226,232,240,0.75)';
 ctx.font = '9px system-ui, sans-serif';
 ctx.fillText(pickDisplayName(star.names, lang), pt.x, pt.y - baseSize - 8);
 }
  });

  // 8.5. Canvas DSO fallback.
  if (!gpuScene) dsoList.forEach(dso => {
 const pt = projectedDsoMap[dso.id];
 if (!pt) return;

 ctx.save();
 if (dso.type === 'galaxy') {
 // Oval shape for galaxy
 ctx.translate(pt.x, pt.y);
 ctx.rotate(30 * Math.PI / 180);
 ctx.beginPath();
 ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
 ctx.strokeStyle = isRedMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(196, 181, 253, 0.6)';
 ctx.lineWidth = 1.5;
 ctx.setLineDash([4, 2]);
 ctx.stroke();
 
 ctx.beginPath();
 ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
 ctx.fillStyle = isRedMode ? '#ffb3b3' : '#ffffff';
 ctx.fill();
 } 
 else if (dso.type === 'nebula') {
 // Cloud-like glow for nebula
 const negGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 15);
 negGrad.addColorStop(0, isRedMode ? 'rgba(239, 68, 68, 0.45)' : 'rgba(244, 63, 94, 0.4)');
 negGrad.addColorStop(0.5, isRedMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(236, 72, 153, 0.15)');
 negGrad.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.beginPath();
 ctx.arc(pt.x, pt.y, 15, 0, Math.PI * 2);
 ctx.fillStyle = negGrad;
 ctx.fill();
 
 ctx.beginPath();
 ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
 ctx.strokeStyle = isRedMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(244, 63, 94, 0.3)';
 ctx.lineWidth = 1;
 ctx.setLineDash([2, 3]);
 ctx.stroke();
 } 
 else if (dso.type === 'cluster') {
 // Sparkling cluster
 ctx.fillStyle = isRedMode ? 'rgba(239, 68, 68, 0.7)' : 'rgba(147, 197, 253, 0.7)';
 for (let i = 0; i < 9; i++) {
 const angle = i * 1.3;
 const r = 3 + (i % 3) * 2.5;
 const cx = pt.x + Math.sin(angle) * r;
 const cy = pt.y + Math.cos(angle) * r;
 ctx.beginPath();
 ctx.arc(cx, cy, 0.8, 0, Math.PI * 2);
 ctx.fill();
 }
 ctx.beginPath();
 ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
 ctx.strokeStyle = isRedMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(147, 197, 253, 0.3)';
 ctx.lineWidth = 1;
 ctx.setLineDash([3, 3]);
 ctx.stroke();
 }
 ctx.restore();

 // Label DSO name MXX
 ctx.fillStyle = isRedMode ? 'rgba(239, 68, 68, 0.65)' : 'rgba(226, 232, 240, 0.75)';
 ctx.font = 'bold 9px system-ui, sans-serif';
 ctx.textAlign = 'center';
 ctx.fillText(dso.messier, pt.x, pt.y - 16);
  });

  const temperatureColor = (star: Star): string => {
      if (star.id === 'sirius' || star.id === 'vega') return '#b9ddff';
      if (star.id === 'betelgeuse' || star.id === 'antares' || star.id === 'aldebaran') return '#ffb199';
      return '#fff7df';
    };
  const gpuStars: GpuSkyPoint[] = gpuScene ? projectedStarList
    .filter(point => arQualityProfileRef.current.id !== 'battery-saver' || point.s.mag <= 2.8)
    .map(point => ({
      id: point.s.id,
      x: point.x,
      y: point.y,
      size: Math.max(1, 4.5 - point.s.mag * 0.7),
      color: temperatureColor(point.s),
      // F3.3: identity-derived phase — no index-counting drift.
      phase: starTwinklePhase(point.s.id),
    })) : [];
  const gpuDeepSky: GpuSkyPoint[] = gpuScene ? projectedDsoList.map(point => ({
      id: point.d.id,
      x: point.x,
      y: point.y,
      size: point.d.type === 'galaxy' ? 4.4 : point.d.type === 'nebula' ? 4.9 : 3.8,
      color: point.d.type === 'galaxy' ? '#c4b5fd' : point.d.type === 'nebula' ? '#f472b6' : '#93c5fd',
    })) : [];
  const gpuLines: GpuConstellationLine[] = [];
  const gpuGuideLines: GpuConstellationLine[] = [];
  const gpuBodies: GpuBody[] = [];
  if (gpuScene) {
    // F2.1: projected guide rings go to their own dimmer GPU line layer.
    if (cachedGuideRings) {
      const projectGuideSegments = (segments: readonly GuideSegment[]): void => {
        segments.forEach(segment => {
          const start = projectCoords(segment.start.az, segment.start.alt);
          const end = projectCoords(segment.end.az, segment.end.alt);
          if (start && end) gpuGuideLines.push({ start, end });
        });
      };
      if (showEclipticRef.current) projectGuideSegments(cachedGuideRings.ecliptic);
      if (showCelestialEquatorRef.current) projectGuideSegments(cachedGuideRings.celestialEquator);
    }
    constellations.forEach(constell => {
      constell.connections.forEach(([startId, endId]) => {
        const start = projectedStarsMap[startId];
        const end = projectedStarsMap[endId];
        if (start && end) gpuLines.push({ start, end });
      });
    });
    ctx.fillStyle = isRedMode ? 'rgba(239,68,68,0.72)' : 'rgba(226,232,240,0.78)';
    ctx.font = '9px system-ui, sans-serif';
    projectedStarList.forEach(point => {
      if (point.s.mag < 1.5 && Math.hypot(point.x - cx, point.y - cy) < 140) {
        ctx.fillText(pickDisplayName(point.s.names, lang), point.x, point.y - 10);
      }
    });
    ctx.font = 'bold 9px system-ui, sans-serif';
    projectedDsoList.forEach(point => ctx.fillText(point.d.messier, point.x, point.y - 16));
  }

 // 9. Render Planets, Sun & Moon (using cached coordinates)
 const projectedBodiesMap: Record<string, ProjectedBody> = {};

 Object.keys(cachedBodiesMap).forEach(key => {
 const c = cachedBodiesMap[key];
 if (!c) return; // noUnchecked: Record indekslemesi 'key' bulunmazken tanimsiz döner; anahtarlar buradan üretiliyor
 const item = c.body;
 try {
 const proj = projectCoords(c.az, c.alt);
 if (proj) {
 projectedBodiesMap[item.key] = {
 x: proj.x, y: proj.y, body: item, az: c.az, alt: c.alt, key: item.key, dist: c.dist, mag: c.mag
 };

  const isPlanetSelected = selectedTargetRef.current?.type === 'planet' && selectedTargetRef.current.data.id === item.key;
  if (gpuScene) {
    const moonPhase = item.key === 'Moon' ? getMoonPhase(observationTime, langRef.current) : undefined;
    gpuBodies.push({
      id: item.key,
      key: item.key,
      x: proj.x,
      y: proj.y,
      size: item.size,
      color: item.color,
      selected: isPlanetSelected,
      moonFraction: moonPhase?.fraction,
      moonWaxing: moonPhase?.isWaxing,
    });
  }
  if (!gpuScene) {
  ctx.shadowBlur = isPlanetSelected ? 20 : 10;
 ctx.shadowColor = isRedMode ? 'rgba(239,68,68,0.8)' : item.color;

 // Draw planet circles
 if (item.key === 'Sun') {
 // Draw Glowing Sun Corona
 const sunGrad = ctx.createRadialGradient(proj.x, proj.y, item.size * 0.2, proj.x, proj.y, item.size * 2.5);
 sunGrad.addColorStop(0, isRedMode ? '#ff3333' : '#ffffff');
 sunGrad.addColorStop(0.2, isRedMode ? '#aa1111' : '#ffea88');
 sunGrad.addColorStop(0.5, isRedMode ? 'rgba(80,0,0,0.3)' : 'rgba(255,102,0,0.25)');
 sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.beginPath();
 ctx.arc(proj.x, proj.y, item.size * 2.5, 0, Math.PI * 2);
 ctx.fillStyle = sunGrad;
 ctx.fill();

 ctx.beginPath();
 ctx.arc(proj.x, proj.y, item.size, 0, Math.PI * 2);
 ctx.fillStyle = isRedMode ? '#ff4d4d' : '#ffea55';
 ctx.fill();
 } 
 else if (item.key === 'Moon') {
 const moonPhase = getMoonPhase(observationTime, langRef.current);

 // Synthesize lunar drawing
 drawMoonPhase(ctx, proj.x, proj.y, item.size, moonPhase.fraction, moonPhase.isWaxing, isRedMode);
 } 
 else if (item.key === 'Saturn') {
 // Draw Saturn Rings first
 ctx.save();
 ctx.translate(proj.x, proj.y);
 ctx.rotate(18 * Math.PI / 180); // tilt rings by 18 degrees
 
 ctx.beginPath();
 ctx.ellipse(0, 0, item.size * 2.1, item.size * 0.55, 0, 0, Math.PI * 2);
 ctx.strokeStyle = isRedMode ? '#b30000' : 'rgba(235, 215, 170, 0.85)';
 ctx.lineWidth = item.size * 0.4;
 ctx.stroke();

 // Ring gap shadow line
 ctx.beginPath();
 ctx.ellipse(0, 0, item.size * 1.55, item.size * 0.42, 0, 0, Math.PI * 2);
 ctx.strokeStyle = isRedMode ? '#150000' : 'rgba(10, 15, 30, 0.85)';
 ctx.lineWidth = item.size * 0.08;
 ctx.stroke();

 ctx.restore();

 // Planet body
 ctx.beginPath();
 ctx.arc(proj.x, proj.y, item.size, 0, Math.PI * 2);
 ctx.fillStyle = isRedMode ? '#e60000' : '#e6c891';
 ctx.fill();
 } 
 else if (item.key === 'Jupiter') {
 // Jupiter ball stripes
 ctx.save();
 ctx.beginPath();
 ctx.arc(proj.x, proj.y, item.size, 0, Math.PI * 2);
 ctx.clip(); // clamp to sphere

 ctx.fillStyle = isRedMode ? '#cc0000' : '#dcb290';
 ctx.fill();

 // Draw cloud belts
 ctx.fillStyle = isRedMode ? '#4d0000' : '#ad7453';
 ctx.fillRect(proj.x - item.size, proj.y - item.size * 0.4, item.size * 2, item.size * 0.22);
 ctx.fillRect(proj.x - item.size, proj.y + item.size * 0.2, item.size * 2, item.size * 0.18);
 ctx.fillRect(proj.x - item.size, proj.y - item.size * 0.8, item.size * 2, item.size * 0.12);

 // Great Red Spot storm
 ctx.beginPath();
 ctx.ellipse(proj.x + item.size * 0.35, proj.y + item.size * 0.35, item.size * 0.3, item.size * 0.18, 0, 0, Math.PI * 2);
 ctx.fillStyle = isRedMode ? '#ff6666' : '#d84e3a';
 ctx.fill();

 ctx.restore();
 } 
 else if (item.key === 'Mars') {
 // Mars sphere with simple details
 ctx.save();
 ctx.beginPath();
 ctx.arc(proj.x, proj.y, item.size, 0, Math.PI * 2);
 ctx.clip();

 ctx.fillStyle = isRedMode ? '#b30000' : '#c65a3b';
 ctx.fill();

 // Polar white cap
 ctx.beginPath();
 ctx.ellipse(proj.x, proj.y - item.size * 0.85, item.size * 0.4, item.size * 0.15, 0, 0, Math.PI * 2);
 ctx.fillStyle = isRedMode ? '#ff9999' : '#ffffff';
 ctx.fill();

 // Dark shadow markings
 ctx.fillStyle = isRedMode ? '#660000' : '#934027';
 ctx.beginPath();
 ctx.arc(proj.x - item.size * 0.2, proj.y + item.size * 0.2, item.size * 0.6, 0, Math.PI * 2);
 ctx.fill();

 ctx.restore();
 } 
  else {
 // General planets (Mercury, Venus, Uranus, Neptune)
 ctx.beginPath();
 ctx.arc(proj.x, proj.y, item.size, 0, Math.PI * 2);
 ctx.fillStyle = isRedMode ? '#cc0000' : item.color;
  ctx.fill();
  }

  ctx.shadowBlur = 0; // reset glow
  }

 // Outer Orbit circle indicators if selected
 if (isPlanetSelected) {
 ctx.strokeStyle = isRedMode ? '#ff4d4d' : '#818cf8';
 ctx.lineWidth = 1.5;
 ctx.beginPath();
 ctx.arc(proj.x, proj.y, item.size * 1.6, 0, Math.PI * 2);
 ctx.stroke();
 }

 // Labels
 ctx.fillStyle = isRedMode ? 'rgba(239, 68, 68, 0.8)' : '#e2e8f0';
 ctx.font = 'bold 9px system-ui, sans-serif';
 const pName = planetNames[item.key]?.[lang] || planetNames[item.key]?.['en'] || item.key;
 ctx.fillText(pName, proj.x, proj.y + item.size + 12);
 }
 } catch (e) {
 console.error(`Planet ${item.key} computation crashed:`, e);
 }
  });

  if (gpuScene) {
    gpuScene.render({
      width: w,
      height: h,
      maxPixelRatio: arQualityProfileRef.current.maxDpr,
      nightVision: isRedMode,
      timeMs: nowTs,
      stars: gpuStars,
      deepSky: gpuDeepSky,
      bodies: gpuBodies,
      constellationLines: gpuLines,
      guideLines: gpuGuideLines,
    });
  }

  // 10. Center Crosshair HUD targeting logic
 const targetThreshold = 35; // lock proximity threshold in screen pixels
 let closestTarget: CelestialTarget | null = null;
 let minDistance = Infinity;

 // Scan stars proximity to center (cx, cy) — F3.3: flat-list scan
 projectedStarList.forEach(pt => {
 const dist = Math.hypot(pt.x - cx, pt.y - cy);
 if (dist < targetThreshold && dist < minDistance) {
 minDistance = dist;
 closestTarget = { type: 'star', data: { ...pt.s, az: pt.az, alt: pt.alt } };
 }
 });

 // Scan DSOs proximity to center (cx, cy) — F3.3: flat-list scan
 projectedDsoList.forEach(pt => {
 const dist = Math.hypot(pt.x - cx, pt.y - cy);
 if (dist < targetThreshold && dist < minDistance) {
 minDistance = dist;
 closestTarget = {
 type: 'dso',
 data: {
 ...pt.d,
 az: pt.az,
 alt: pt.alt
 }
 };
 }
 });

 // Scan planets proximity to center (cx, cy)
 Object.keys(projectedBodiesMap).forEach(key => {
 const pt = projectedBodiesMap[key];
 if (!pt) return; // noUnchecked: Record indekslemesi 'key' bulunamazken tanimsiz döner; anahtarlar buradan üretiliyor
 const dist = Math.hypot(pt.x - cx, pt.y - cy);
 if (dist < targetThreshold + 10 && dist < minDistance) {
 minDistance = dist;
 closestTarget = {
 type: 'planet',
 data: {
 id: pt.key,
 name: planetNames[pt.key]?.[lang] || planetNames[pt.key]?.['en'] || pt.key,
 az: pt.az,
 alt: pt.alt,
 dist: pt.dist,
 mag: pt.mag
 }
 };
 }
 });

 // Lock on feedback & synthesizer trigger
  const targetCandidate = closestTarget as CelestialTarget | null;
  if (targetCandidate) {
   const nextTarget = targetCandidate;
   const closestId = getTargetId(nextTarget);
   const currentSelectedId = getTargetId(selectedTargetRef.current);
  const currentSelectedType = selectedTargetRef.current?.type;

  if (closestId !== dismissedTargetIdRef.current) {
  if (closestId !== currentSelectedId || nextTarget.type !== currentSelectedType) {
  void lockHaptic();
  setSelectedTarget(nextTarget);
  selectedTargetRef.current = nextTarget;
  }
  }
 if (dismissedTargetIdRef.current && closestId !== dismissedTargetIdRef.current) {
 dismissedTargetIdRef.current = null;
 }
 } else {
 dismissedTargetIdRef.current = null;
 // If center has nothing, we preserve selected target if selected from SEARCH
 if (!searchTargetIdRef.current) {
 if (selectedTargetRef.current !== null) {
 setSelectedTarget(null);
 selectedTargetRef.current = null;
 }
 }
 }

 // Draw active search visual tracker arrow (Radar Navigation)
 if (searchTargetIdRef.current) {
 let targetLoc: { x: number; y: number } | null = null;
 let targetAz: number | null = null;
 let tName = '';

 // Match searched object
 const starMatch = stars.find(x => x.id === searchTargetIdRef.current);
 const dsoMatch = dsoList.find(x => x.id === searchTargetIdRef.current);
 if (starMatch) {
 const sh = Horizon(cachedAstroTime, cachedObserver, starMatch.ra, starMatch.dec, 'normal');
 targetLoc = projectCoords(sh.azimuth, sh.altitude, true);
 targetAz = sh.azimuth;
 tName = pickDisplayName(starMatch.names, langRef.current);
 } else if (dsoMatch) {
 const sh = Horizon(cachedAstroTime, cachedObserver, dsoMatch.ra, dsoMatch.dec, 'normal');
 targetLoc = projectCoords(sh.azimuth, sh.altitude, true);
 targetAz = sh.azimuth;
 tName = pickDisplayName(dsoMatch.names, langRef.current);
 } else {
 const bodyMatch = cachedBodiesMap[searchTargetIdRef.current];
 if (bodyMatch) {
 targetLoc = projectCoords(bodyMatch.az, bodyMatch.alt, true);
 targetAz = bodyMatch.az;
 const key = searchTargetIdRef.current;
 tName = planetNames[key]?.[langRef.current] || planetNames[key]?.['en'] || key;
 }
 }

 if (targetLoc) {
 const dx = targetLoc.x - cx;
 const dy = targetLoc.y - cy;
 const dist = Math.hypot(dx, dy);

 // If out of view, draw pointer arrow at screen border edges
 if (dist > Math.min(w, h) * 0.45) {
 const angle = Math.atan2(dy, dx);
 const borderR = Math.min(w, h) * 0.42;
 const arrowX = cx + Math.cos(angle) * borderR;
 const arrowY = cy + Math.sin(angle) * borderR;

 ctx.save();
 ctx.translate(arrowX, arrowY);
 ctx.rotate(angle);

 // Draw arrow polygon pointing outwards
 ctx.beginPath();
 ctx.moveTo(12, 0);
 ctx.lineTo(-6, -10);
 ctx.lineTo(-2, 0);
 ctx.lineTo(-6, 10);
 ctx.closePath();

 ctx.fillStyle = isRedMode ? '#ef4444' : '#22d3ee';
 ctx.shadowBlur = 10;
 ctx.shadowColor = isRedMode ? '#ef4444' : '#22d3ee';
 ctx.fill();
 ctx.restore();

 const targetTrackingAz = targetAz !== null
   ? (nativeMatrix
     ? convertTrueToTrackingAzimuth(targetAz, target.declination, calibrationOffsetRef.current)
     : targetAz)
   : 0;
 const centerAzimuth = Math.hypot(r13, r23) > 1e-4
   ? ((Math.atan2(-r13, -r23) * 180) / Math.PI + 360) % 360
   : (current.alpha + calibrationOffsetRef.current + 360) % 360;
 const angularDist = targetAz !== null
   ? calculateAngularDistance(targetTrackingAz, centerAzimuth)
   : Math.min(180, Math.round(dist / 10));

 // Radar instructions text
 ctx.fillStyle = isRedMode ? '#ef4444' : '#a7f3d0';
 ctx.font = 'bold 11px system-ui, sans-serif';
 ctx.fillText(`⟶ ${tName} (${Math.round(angularDist)}°)`, arrowX, arrowY + (Math.sin(angle) > 0 ? -18 : 22));
 } else {
 // Target locked on center screen, color it green/emerald!
 ctx.strokeStyle = isRedMode ? '#ef4444' : '#10b981';
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.arc(targetLoc.x, targetLoc.y, 45, 0, Math.PI * 2);
 ctx.stroke();

 // target matched
 if (!selectedTargetRef.current) {
 if (starMatch) {
 const sh = Horizon(cachedAstroTime, cachedObserver, starMatch.ra, starMatch.dec, 'normal');
 const target: CelestialTarget = { type: 'star', data: { ...starMatch, az: sh.azimuth, alt: sh.altitude } };
 setSelectedTarget(target);
 selectedTargetRef.current = target;
 }
 else if (dsoMatch) {
 const pm = projectedDsoMap[searchTargetIdRef.current];
 const target: CelestialTarget = {
 type: 'dso',
 data: {
 ...dsoMatch,
 az: pm?.az ?? 0,
 alt: pm?.alt ?? 0
 }
 };
 setSelectedTarget(target);
 selectedTargetRef.current = target;
 } else {
 const pm = projectedBodiesMap[searchTargetIdRef.current];
 if (pm) {
 const target: CelestialTarget = {
 type: 'planet',
 data: {
 id: pm.key,
 name: tName,
 az: pm.az,
 alt: pm.alt,
 dist: 1.0,
 mag: 1
 }
 };
 setSelectedTarget(target);
 selectedTargetRef.current = target;
 }
 }
 }
 }
 }
 }

 ctx.restore();
 animationFrameId = requestAnimationFrame(render);
 };

 animationFrameId = requestAnimationFrame(render);

 return () => {
 isDestroyed = true;
 cancelAnimationFrame(animationFrameId);
 window.removeEventListener('resize', handleResize);
 document.removeEventListener('visibilitychange', handleVisibilityChange);
 };
 }, [lang, orientationRef]);



 const bestWindow = useMemo(
   () => calculateAstroPhotoWindow(hourly, currentLocation.timezone),
   [hourly, currentLocation.timezone],
 );

 const sunTimes = useMemo(
   () => (showGuide
     ? getEveningSunTimes(new Date(), currentLocation.latitude, currentLocation.longitude, currentLocation.timezone)
     : null),
   [showGuide, currentLocation.latitude, currentLocation.longitude, currentLocation.timezone],
 );

 const formatTime = (date: Date | null | undefined) => formatGuideTime(date, currentLocation.timezone);

 const effectiveHorizontalFov = useMemo(() => {
   if (!arMode) return DEFAULT_HORIZONTAL_FOV;
   const viewportWidth = containerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 360);
   const viewportHeight = containerRef.current?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 640);
   return Math.round(
     calculateEffectiveHorizontalFov(
       nativeCameraModel,
       cameraStream.width,
       cameraStream.height,
       viewportWidth,
       viewportHeight,
     ),
   );
 }, [arMode, nativeCameraModel, cameraStream.width, cameraStream.height]);
 const isCameraCalibrated = Boolean(arMode && nativeCameraModel?.available);

 // Unified list of targets for searching drawer
 const searchResults = useMemo(() => {
 const list = [
 ...stars.map(s => ({ id: s.id, type: 'star', name: pickDisplayName(s.names, lang), subtitle: getTranslation('star', lang) })),
 ...dsoList.map(d => ({ id: d.id, type: 'dso', name: pickDisplayName(d.names, lang), subtitle: `${d.messier} - ${d.subtitle[lang] || d.subtitle['en']}` })),
 ...['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].map(id => {
 const name = planetNames[id]?.[lang] || planetNames[id]?.en || id;
 return { id, type: 'planet', name, subtitle: getTranslation('planet', lang) };
 })
 ];

  const filtered = !searchQuery.trim() ? list : list.filter(item => 
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return filtered.sort((left, right) => Number(favorites.includes(right.id)) - Number(favorites.includes(left.id)));
  }, [searchQuery, lang, favorites]);

 return (
  <div 
  ref={containerRef} 
  className="relative w-full h-[85vh] md:h-[90vh] rounded-xl overflow-hidden shadow-sm border border-white/5"
  style={{ background: arMode ? '#000000' : nightMode || fieldMode ? '#090000' : 'radial-gradient(circle at 50% 72%, #060a1f 0%, #030510 42%, #000000 100%)' }}
 >
 {/* Local Toast Notification */}
 {toastMsg && (
 <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500/50 p-3 px-5 rounded-xl z-50 text-sm text-white font-semibold flex items-center gap-2 shadow-sm transition-all duration-300">
 <AlertCircle className="w-5 h-5 text-red-400" />
 <span>{toastMsg}</span>
 </div>
 )}

 {/* 1. HTML5 Camera Feed backing layer */}
 <video
 ref={videoRef}
 playsInline
 muted
 autoPlay
 style={{
 position: 'absolute',
 inset: 0,
 width: '100%',
 height: '105%', // slightly oversize to cover any browser margins
 objectFit: 'cover',
 pointerEvents: 'none',
 zIndex: 0,
 opacity: arMode && videoPlaying ? 0.85 : 0,
 transition: 'opacity 0.5s ease'
 }}
  />

  {/* 2. GPU celestial layer. UI and hit testing remain in the interactive canvas above it. */}
  <canvas
  ref={webglCanvasRef}
  aria-hidden="true"
  className={`absolute inset-0 w-full h-full z-[5] pointer-events-none transition-opacity duration-300 ${gpuRendererAvailable ? 'opacity-100' : 'opacity-0'}`}
  />

  {/* 3. Interactive Sky Canvas */}
 <canvas
 ref={canvasRef}
 onTouchStart={handleTouchStart}
 onTouchMove={handleTouchMove}
 onMouseDown={handleMouseDown}
 onMouseMove={handleMouseMove}
 onMouseUp={handleMouseUpOrLeave}
 onMouseLeave={handleMouseUpOrLeave}
 className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing"
 />

  {/* Compact AR command bar */}
  <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2">
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/80 p-1.5 backdrop-blur-md shadow-sm">
      <button type="button" title={getTranslation('arMode', lang)} aria-label={getTranslation('arMode', lang)} aria-pressed={arMode} onClick={() => setArMode(true)} className={`grid min-h-11 min-w-11 h-11 w-11 place-items-center rounded-md transition ${arMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
        <Camera className="h-4 w-4" />
      </button>
      <button type="button" title={getTranslation('virtualMode', lang)} aria-label={getTranslation('virtualMode', lang)} aria-pressed={!arMode} onClick={() => setArMode(false)} className={`grid min-h-11 min-w-11 h-11 w-11 place-items-center rounded-md transition ${!arMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
        <Sparkles className="h-4 w-4" />
      </button>
      <span className="mx-1 h-5 w-px bg-white/10" />
      <button type="button" onClick={startCalibration} title={productT('ar.quality', lang)} aria-label={`${productT('ar.quality', lang)}: ${productT(trackingQuality === 'good' ? 'ar.qualityGood' : trackingQuality === 'fair' ? 'ar.qualityFair' : 'ar.qualityPoor', lang)}`} className={`flex min-h-11 h-11 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${trackingQuality === 'good' ? 'text-emerald-300' : trackingQuality === 'fair' ? 'text-amber-300' : 'text-rose-300'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${sensorStatus === 'active' ? trackingQuality === 'good' ? 'bg-emerald-400' : 'bg-amber-400' : sensorStatus === 'denied' ? 'bg-rose-400' : 'bg-sky-400'}`} />
        <Compass className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{productT(trackingQuality === 'good' ? 'ar.qualityGood' : trackingQuality === 'fair' ? 'ar.qualityFair' : 'ar.qualityPoor', lang)}</span>
      </button>
      {sensorStatus === 'requires-interaction' && (
        <button type="button" onClick={requestIosPermission} aria-label={getTranslation('startSensor', lang)} className="min-h-11 h-11 rounded-md bg-emerald-600 px-2.5 text-xs font-semibold text-white">
          {getTranslation('startSensor', lang)}
        </button>
      )}
    </div>

    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/80 p-1.5 backdrop-blur-md shadow-sm">
       <button type="button" title={t('obs.searchBtn', lang)} aria-label={t('obs.searchBtn', lang)} aria-expanded={showSearch} onClick={() => setShowSearch(true)} className="grid min-h-11 min-w-11 h-11 w-11 place-items-center rounded-md bg-indigo-600 text-white transition hover:bg-indigo-500">
         <Search className="h-4 w-4" />
       </button>
       <button type="button" title={getTranslation('captureView', lang)} aria-label={getTranslation('captureView', lang)} onClick={() => void captureArView()} className="grid min-h-11 min-w-11 h-11 w-11 place-items-center rounded-md text-slate-300 transition hover:bg-slate-800 hover:text-white">
         <Download className="h-4 w-4" />
       </button>
       <button type="button" title={getTranslation('sceneControls', lang)} aria-label={getTranslation('sceneControls', lang)} aria-expanded={showSceneControls} aria-pressed={showSceneControls} onClick={() => setShowSceneControls(value => !value)} className={`grid min-h-11 min-w-11 h-11 w-11 place-items-center rounded-md transition ${showSceneControls ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </div>
  </div>

  {/* F6.4: AR HUD şeridi — FOV / canlı azimut / takip kalitesi cam-pill'ı.
     Eski komut-çubuğu FOV pill'i tek kaynak olsun diye buraya taşındı. */}
  {arMode && (
    <ArHudStrip
      lang={lang}
      fov={effectiveHorizontalFov}
      trackingQuality={trackingQuality}
      headingTextRef={hudHeadingTextRef}
    />
  )}

  {sensorStatus === 'not-supported' && (
    <div role="status" className="absolute top-16 left-3 z-20 flex max-w-[70%] items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-2xs font-semibold text-amber-300 backdrop-blur-md">
      <Compass className="h-3.5 w-3.5 shrink-0" />
      {getTranslation('approxCompass', lang)}
    </div>
  )}

  {showSceneControls && (
    <div className="absolute top-16 right-3 z-30 w-56 max-h-[76vh] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-xl backdrop-blur-xl animate-slide-up">
      <button type="button" onClick={() => calibrationOffset !== 0 ? setCalibrationOffset(0) : startCalibration()} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-semibold text-slate-200 hover:bg-white/5">
        <Compass className="h-4 w-4 text-indigo-300" />
        {calibrationOffset !== 0 ? getTranslation('resetCompass', lang) : getTranslation('calibTitle', lang)}
      </button>
      <button type="button" aria-pressed={showTimeTravel} onClick={() => setShowTimeTravel(value => !value)} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-semibold ${showTimeTravel ? 'bg-amber-500/15 text-amber-200' : 'text-slate-200 hover:bg-white/5'}`}>
        <Clock className="h-4 w-4" />
        {getTranslation('timeTravel', lang)}
      </button>
      <button type="button" aria-pressed={showArtwork} onClick={() => setShowArtwork(value => !value)} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-semibold ${showArtwork ? 'bg-indigo-500/15 text-indigo-200' : 'text-slate-200 hover:bg-white/5'}`}>
        <Sparkles className="h-4 w-4" />
        {getTranslation('mythology', lang)}
      </button>
      {/* F2.1: scene layer toggles wired to the actual draw calls. */}
      <button type="button" aria-pressed={showGrid} onClick={() => setShowGrid(value => !value)} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-semibold ${showGrid ? 'bg-indigo-500/15 text-indigo-200' : 'text-slate-200 hover:bg-white/5'}`}>
        <Grid3x3 className="h-4 w-4" />
        {getTranslation('layerGrid', lang)}
      </button>
      <button type="button" aria-pressed={showEcliptic} onClick={() => setShowEcliptic(value => !value)} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-semibold ${showEcliptic ? 'bg-amber-500/15 text-amber-200' : 'text-slate-200 hover:bg-white/5'}`}>
        <Orbit className="h-4 w-4" />
        {getTranslation('layerEcliptic', lang)}
      </button>
      <button type="button" aria-pressed={showCelestialEquator} onClick={() => setShowCelestialEquator(value => !value)} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-semibold ${showCelestialEquator ? 'bg-sky-500/15 text-sky-200' : 'text-slate-200 hover:bg-white/5'}`}>
        <Navigation className="h-4 w-4" />
        {getTranslation('layerCelestialEquator', lang)}
      </button>
       <button type="button" aria-pressed={showGuide} onClick={() => setShowGuide(value => !value)} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-semibold ${showGuide ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-200 hover:bg-white/5'}`}>
         <Sunset className="h-4 w-4" />
         {getTranslation('photoGuide', lang)}
       </button>
       <div className="mt-1 border-t border-white/10 px-3 py-2 text-2xs font-semibold text-slate-400 space-y-1">
         <div className="flex items-center justify-between gap-3">
           <span>{getTranslation(arQualityProfileRef.current.labelKey, lang)}</span>
           <span>{recentSessionCount} {getTranslation('recentSessions', lang)}</span>
         </div>
         <div className="flex items-center justify-between gap-2 text-slate-300">
           <span>FOV: {effectiveHorizontalFov}°</span>
           <span className={isCameraCalibrated ? 'text-emerald-400' : 'text-amber-300'}>
             {isCameraCalibrated ? 'Kalibre / Calibrated' : `Varsayılan (${DEFAULT_HORIZONTAL_FOV}°)`}
           </span>
         </div>
       </div>
    </div>
  )}

 {/* 4. Sleek Center Crosshair targeting overlay */}
 <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
 <div className="relative flex items-center justify-center">
 {/* Target locked glow boundaries */}
 <div className={`absolute rounded-full border border-dashed transition-all duration-300 ${
 selectedTarget 
 ? 'w-[75px] h-[75px] border-emerald-400/60 rotate-45 scale-105' 
 : 'w-[48px] h-[48px] border-white/5 rotate-0'
 }`} />

 {/* Internal targeted reticle rings */}
 <div className={`w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center transition-all ${
 selectedTarget 
 ? 'border-emerald-500 bg-emerald-500/10 scale-90' 
 : 'border-white/5 bg-indigo-500/5'
 }`}>
 <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
 selectedTarget ? 'bg-emerald-400' : 'bg-indigo-400/50'
 }`} />
 </div>

 {/* Lock-on visual texts */}
 {selectedTarget && (
 <span className="absolute top-[48px] text-4xs tracking-widest font-black text-emerald-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-emerald-500/20 shadow">
 {getTranslation('targetAcquired', lang)}
 </span>
 )}
 </div>
 </div>

 {/* 5. Bottom Detail Card for Locked target (sliding glassmorphism card) */}
 {selectedTarget && (
 <div className="absolute bottom-6 left-4 right-4 z-20 mx-auto max-w-lg bg-slate-900/85 backdrop-blur-lg border border-white/10 p-5 rounded-xl shadow-sm transition-all duration-300 animate-slide-up">
  <div className="flex justify-between items-start mb-2.5">
 <div>
 {/* Type Badge */}
 <span className="text-3xs font-semibold uppercase tracking-widest bg-slate-800/30 border border-white/5 text-indigo-400 px-2 py-0.5 rounded-full mb-1 inline-block">
  {getTargetDisplayType(selectedTarget, lang)}
 </span>

 {/* Object Name */}
 <h3 className="text-lg font-black text-white leading-tight">
  {getTargetDisplayName(selectedTarget, lang)}
 </h3>
  </div>
  <button
  type="button"
  onClick={() => {
  const targetId = getTargetId(selectedTarget);
  if (targetId) toggleFavoriteTarget(targetId);
  }}
  title={favorites.includes(getTargetId(selectedTarget) ?? '') ? getTranslation('removeFavoriteTarget', lang) : getTranslation('favoriteTarget', lang)}
  aria-label={favorites.includes(getTargetId(selectedTarget) ?? '') ? getTranslation('removeFavoriteTarget', lang) : getTranslation('favoriteTarget', lang)} className={`mr-1 grid min-h-[48px] min-w-[48px] place-items-center rounded-md border transition ${favorites.includes(getTargetId(selectedTarget) ?? '') ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-white/10 text-slate-400 hover:text-amber-300'}`}
  >
  <StarIcon className="h-4 w-4" fill={favorites.includes(getTargetId(selectedTarget) ?? '') ? 'currentColor' : 'none'} />
  </button>

  {/* F2.8: dedicated guide button; favoriting never starts radar navigation */}
  <button
  type="button"
  onClick={() => {
  const targetId = getTargetId(selectedTarget);
  if (targetId) setSearchTargetId(targetId);
  }}
  title={getTranslation('guideToTarget', lang)}
  aria-label={getTranslation('guideToTarget', lang)} className={`mr-1 grid min-h-[48px] min-w-[48px] place-items-center rounded-md border border-white/10 text-slate-400 transition hover:text-sky-300 ${searchTargetId === getTargetId(selectedTarget) ? 'border-sky-400/40 bg-sky-400/10 text-sky-300' : ''}`}
  >
  <Navigation className="h-4 w-4" />
  </button>
  
  {/* Quick calibration helper button inside panel */}
 <button 
 onClick={() => {
 const targetId = selectedTarget.type === 'star' ? selectedTarget.data.id : selectedTarget.data.id;
 dismissedTargetIdRef.current = targetId;
 setSelectedTarget(null);
 setSearchTargetId(null);
 }}
 aria-label={t('common.close', lang)} className="text-slate-500 hover:text-slate-300 min-w-[48px] min-h-[48px] flex items-center justify-center"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Description */}
  <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2 sm:line-clamp-none">
 {selectedTarget.type === 'dso'
 ? selectedTarget.data.desc[lang] || selectedTarget.data.desc['en']
 : getLocalizedDescription(selectedTarget.type === 'star' ? selectedTarget.data.id : selectedTarget.data.id, lang) ||
 getTranslation('defaultCelestialDesc', lang)}
 </p>

 {/* Coordinate Details Matrix */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-900 pt-3.5 text-slate-400">
   <div>
  <span className="text-2xs block font-semibold text-slate-500 uppercase">{getTranslation('azimuth', lang)}</span>
  <span className="text-[0px] font-mono font-semibold text-slate-200">
  <span className="text-xs">{`${Math.round(getTargetAz(selectedTarget))}${String.fromCharCode(176)}`}</span>
 {`${Math.round(getTargetAz(selectedTarget))}°`}
 </span>
 </div>
   <div>
  <span className="text-2xs block font-semibold text-slate-500 uppercase">{getTranslation('altitude', lang)}</span>
  <span className="text-[0px] font-mono font-semibold text-slate-200">
  <span className="text-xs">{`${Math.round(getTargetAlt(selectedTarget))}${String.fromCharCode(176)}`}</span>
 {`${Math.round(getTargetAlt(selectedTarget))}°`}
 </span>
 </div>
  <div className="hidden sm:block">
 <span className="text-2xs block font-semibold text-slate-500 uppercase">{getTranslation('magnitude', lang)}</span>
 <span className="text-xs font-mono font-semibold text-slate-200">
 {getTargetMagnitude(selectedTarget)}
 </span>
 </div>
  <div className="hidden sm:block">
 <span className="text-2xs block font-semibold text-slate-500 uppercase">{getTranslation('distance', lang)}</span>
 <span className="text-xs font-mono font-semibold text-slate-200">
 {getTargetDistance(selectedTarget)}
 </span>
 </div>
 </div>
 </div>
 )}

 {/* 6. Static Helper calibration instructions text */}
 {!selectedTarget && (
 <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none text-center">
 <p className="text-2xs font-semibold text-slate-500 tracking-wide bg-slate-900/80 backdrop-blur px-4 py-2 rounded-xl border border-white/5 max-w-md mx-auto">
 {getTranslation('calibHint', lang)}
 </p>
 </div>
 )}

 {/* 7. TIME TRAVEL sliding range selector */}
 {showTimeTravel && (
 <div 
 className="absolute left-4 right-4 z-30 mx-auto max-w-md bg-slate-900/95 border border-white/5 p-4 rounded-xl shadow-sm flex flex-col gap-3 animate-slide-up transition-all duration-300"
 style={{ bottom: selectedTarget ? '215px' : '96px' }}
 >
 <div className="flex justify-between items-center">
 <h4 className="text-xs font-semibold uppercase text-amber-500 flex items-center gap-1">
 <Clock className="w-3.5 h-3.5" />
 {getTranslation('timeTravel', lang)}
 </h4>
 
 {/* Reset to Live Time */}
 {timeTravelHours !== 0 && (
 <button 
 onClick={() => setTimeTravelHours(0)}
 className="text-2xs bg-indigo-950 text-indigo-400 font-semibold px-2 py-0.5 rounded-full hover:bg-indigo-900 border border-white/5"
 >
 {getTranslation('liveTime', lang)}
 </button>
 )}
 </div>

 {/* Slider input */}
 <input
 type="range"
 min="-120"
 max="120"
 value={timeTravelHours}
 onChange={(e) => setTimeTravelHours(Number(e.target.value))}
 aria-label={getTranslation('timeTravel', lang)}
 className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
 />

 <div className="flex justify-between text-2xs font-mono text-slate-500 font-semibold">
  <span>{getTranslation('timeTravelPastLabel', lang)}</span>
 <span className="text-white bg-slate-900 border border-white/5 px-2 py-0.5 rounded font-black">
 {timeTravelHours > 0 ? `+${timeTravelHours}` : timeTravelHours} {getTranslation('hoursUnit', lang)}
 </span>
  <span>{getTranslation('timeTravelFutureLabel', lang)}</span>
 </div>

 {/* Formatted future/past date label */}
 <span className="text-xs font-mono font-semibold text-indigo-400 text-center">
 {new Date(Date.now() + timeTravelHours * 3600000).toLocaleString([], { 
 dateStyle: 'medium', 
 timeStyle: 'short',
 timeZone: currentLocation.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
 })}
 </span>
 </div>
 )}

 {/* 8. OBJECT SEARCH modal (F5.4 StandardModal: focus trap + ESC + geri tuşu) */}
 <StandardModal
 open={showSearch}
 onClose={() => {
 setShowSearch(false);
 setSearchQuery('');
 }}
 variant="center"
 z={90}
 ariaLabel={getTranslation('searchPlaceholder', lang)}
 panelClassName="w-full max-w-md h-[70vh]"
 >
 
 {/* Search Header */}
 <div className="p-4 border-b border-white/5 flex items-center gap-3">
 <Search className="w-5 h-5 text-indigo-500" />
 <input
 type="text"
 placeholder={getTranslation('searchPlaceholder', lang)}
 aria-label={getTranslation('searchPlaceholder', lang)}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm font-semibold"
 autoFocus
 />
 <button
 onClick={() => {
 setShowSearch(false);
 setSearchQuery('');
 }}
 aria-label={t('common.close', lang)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* List */}
 <div className="flex-1 overflow-y-auto p-4 space-y-1">
 <h5 className="text-2xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2">
 {getTranslation('allObjects', lang)}
 </h5>
 
 {searchResults.length > 0 ? (
 searchResults.map(item => (
 <button
 key={item.id}
 onClick={() => {
 setSearchTargetId(item.id);
 setShowSearch(false);
 setSearchQuery('');
 // Flash selected targets
 setSelectedTarget(null);
 }}
 className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-600/10 border border-transparent hover:border-white/5 text-left transition group"
 >
 <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300">
 {item.name}
 </span>
 <span className="text-3xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
 {item.subtitle}
 </span>
 </button>
 ))
 ) : (
 <div className="text-center text-slate-500 text-xs py-8">
 {getTranslation('noSearchResults', lang)}
 </div>
 )}
 </div>
 </StandardModal>

 {/* 8.5. COMPASS CALIBRATION WIZARD modal (F5.4 StandardModal) */}
 <StandardModal
 open={showCalibWizard}
 onClose={() => setShowCalibWizard(false)}
 variant="center"
 z={100}
 ariaLabel={getTranslation('calibTitle', lang)}
 panelClassName="w-[92%] max-w-xs p-5 flex flex-col items-center justify-start text-center relative max-h-[85vh] overflow-y-auto my-auto py-6"
 >
 
 {/* Close button if not successful yet */}
 {!calibSuccess && (
 <button
 onClick={() => setShowCalibWizard(false)}
 aria-label={t('common.close', lang)} className="fixed top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition cursor-pointer z-[110] shadow-sm border border-white/5"
 >
 <X className="w-5 h-5" />
 </button>
 )}

 {/* Wizard panel content (kabuk StandardModal'da) */}
 {!calibSuccess ? (
 <>
 {/* Title */}
 <h3 className="text-base font-black text-white mb-1 flex items-center gap-1.5 justify-center">
 <Compass className="w-4 h-4 text-indigo-500" />
 {getTranslation('calibTitle', lang)}
 </h3>
 
 {/* Description */}
 <p className="text-2xs text-slate-400 leading-normal mb-4 px-1">
 {getTranslation('calibDesc', lang)}
 </p>

 {/* 3D Mobile Phone model container */}
 <div className="relative w-48 h-36 mb-4 flex items-center justify-center select-none" style={{ perspective: '600px' }}>
 {/* Space tracking grid background */}
 <div className="absolute inset-0 bg-slate-900/40 rounded-full border border-white/5 scale-95 flex items-center justify-center overflow-hidden">
 <div className="absolute w-44 h-44 border border-white/5 rounded-full" />
 <div className="absolute w-28 h-28 border border-white/5 rounded-full" />
 <div className="absolute w-px h-full bg-indigo-500/5" />
 <div className="absolute h-px w-full bg-indigo-500/5" />
 </div>
 
 {/* Rotating 3D phone container */}
 <div className="w-16 h-28 rounded-[1rem] bg-slate-800/30 border border-white/5 relative flex items-center justify-center shadow-sm" style={{ transformStyle: 'preserve-3d' }}>
 {/* Screen panel (front) */}
 <div className="absolute inset-0.5 rounded-[0.8rem] bg-slate-900/90 border border-white/5 flex flex-col items-center justify-center p-1.5" style={{ transform: 'translateZ(1px)', backfaceVisibility: 'hidden' }}>
 {/* Notch */}
 <div className="w-6 h-1.5 bg-indigo-950 rounded-b-md absolute top-0" />
 {/* Space Radar screen details */}
 <div className="w-full h-full border border-white/5 rounded-[0.5rem] bg-[#02030a] flex items-center justify-center relative overflow-hidden">
 <div className="absolute inset-0 flex items-center justify-center">
 {/* Crosshair */}
 <div className="w-4 h-4 border border-dashed border-cyan-500/40 rounded-full" />
 <div className="w-1 h-1 bg-cyan-400 rounded-full" />
 </div>
 {/* Fake stars */}
 <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-2 left-4" />
 <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-6 right-2 opacity-50" />
 <div className="w-0.5 h-0.5 bg-white rounded-full absolute bottom-4 left-5" />
 </div>
 </div>

 {/* Back face (camera side) */}
 <div className="absolute inset-0.5 rounded-[0.8rem] bg-slate-900/90 border border-white/5 flex items-center justify-center" style={{ transform: 'translateZ(-1px) rotateY(180deg)', backfaceVisibility: 'hidden' }}>
 {/* Camera Lens */}
 <div className="w-4 h-4 rounded-full bg-slate-900/40 border border-white/5 flex items-center justify-center shadow-inner">
 <div className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-white/5 flex items-center justify-center">
 <div className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Progress Gauges */}
 <div className="w-full space-y-3 mb-1">
 {/* Roll progress */}
 <div className="space-y-0.5 text-left">
 <div className="flex justify-between items-center text-3xs font-semibold text-slate-400">
 <span>{getTranslation('calibRoll', lang)}</span>
 <span className="font-mono text-indigo-400">{rollProgress}%</span>
 </div>
 <div className="w-full h-1 bg-slate-900/40 rounded-full overflow-hidden border border-white/5">
 <div
 className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300 rounded-full"
 style={{ width: `${rollProgress}%` }}
 />
 </div>
 </div>

 {/* Pitch progress */}
 <div className="space-y-0.5 text-left">
 <div className="flex justify-between items-center text-3xs font-semibold text-slate-400">
 <span>{getTranslation('calibPitch', lang)}</span>
 <span className="font-mono text-indigo-400">{pitchProgress}%</span>
 </div>
 <div className="w-full h-1 bg-slate-900/40 rounded-full overflow-hidden border border-white/5">
 <div
 className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300 rounded-full"
 style={{ width: `${pitchProgress}%` }}
 />
 </div>
 </div>
 </div>

 {/* Total Calibration Progress Indicator */}
 <div className="text-3xs font-semibold uppercase tracking-widest text-slate-500 mt-3">
 {getTranslation('gatheringSensorData', lang)} ({totalProgress}%)
 </div>
 </>
 ) : (
 // Success confirmation checkmark screen
 <div className="flex flex-col items-center justify-center p-3">
 <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-3">
 <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </div>
 <h3 className="text-sm font-black text-emerald-400 mb-1">
 {getTranslation('calibSuccessMsg', lang)}
 </h3>
 <p className="text-2xs text-slate-400">
 {getTranslation('redirectingToMap', lang)}
 </p>
 </div>
 )}
 </StandardModal>

 {/* 9. ASTROPHOTOGRAPHY GUIDE Drawer Overlay (Glassmorphism layout) */}
 {showGuide && (
 <div className="absolute inset-y-0 right-0 z-35 w-full sm:w-[350px] bg-slate-900/90 backdrop-blur-xl border-l border-white/10 shadow-sm flex flex-col p-6 animate-slide-left">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
 <Sunset className="w-5 h-5 text-amber-500" />
 {getTranslation('photoGuide', lang)}
 </h3>
 <button
 onClick={() => setShowGuide(false)}
 aria-label={t('common.close', lang)} className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto space-y-6 pr-1">
 {/* Golden Hour schedule */}
 <div>
 <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
 {t('astro.goldenHour', lang)}
 </h4>
 <div className="space-y-2">
 <div className="flex justify-between items-center bg-amber-950/20 p-3 rounded-xl border border-amber-900/30">
 <span className="text-2xs font-semibold text-amber-500 max-w-[120px]">
 {t('astro.goldenHourStart', lang)}
 </span>
 <span className="text-xs font-mono text-amber-400 text-right">
 {formatTime(sunTimes?.goldenHour)}<br />{formatTime(sunTimes?.sunsetStart)}
 </span>
 </div>
 <div className="flex justify-between items-center bg-blue-950/20 p-3 rounded-xl border border-blue-900/30">
 <span className="text-2xs font-semibold text-blue-500 max-w-[120px]">
 {t('astro.blueHourStart', lang)}
 </span>
 <span className="text-xs font-mono text-blue-400 text-right">
 {formatTime(sunTimes?.sunset)}<br />{formatTime(sunTimes?.dusk)}
 </span>
 </div>
 <div className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl border border-white/5">
 <span className="text-2xs font-semibold text-indigo-500 max-w-[120px]">
 {t('astro.astroTwilight', lang)}
 </span>
 <span className="text-xs font-mono text-indigo-400 text-right">
 {formatTime(sunTimes?.nauticalDusk)}<br />{formatTime(sunTimes?.night)}
 </span>
 </div>
 </div>
 </div>

 {/* Weather Suitability widget */}
 <div>
 <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
 {getTranslation('skySuitability', lang)}
 </h4>
 {!hourly ? (
 <div className="space-y-2" role="status" aria-label={t('astro.analyzing', lang)}>
 <div className="skeleton-block h-3 w-32" />
 <div className="skeleton-block h-3 w-24" />
 </div>
 ) : bestWindow ? (
 <div className="space-y-4">
 <div className="bg-gradient-to-r from-emerald-950/40 to-indigo-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center">
 <span className="bg-emerald-500/20 text-emerald-400 text-3xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
 {t('astro.idealRange', lang)}
 </span>
 <p className="text-2xs font-medium text-slate-400 mb-1">{t('astro.bestTime', lang)}</p>
 <h3 className="text-2xl font-black text-white font-mono tracking-tight">
 {bestWindow.start} - {bestWindow.end}
 </h3>
 </div>

 <div className={`p-4 rounded-xl border flex items-start gap-3 ${bestWindow.avgWind > 20 ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900 border-white/5'}`}>
 {bestWindow.avgWind > 20 ? <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" /> : <Wind className="w-5 h-5 text-emerald-400 shrink-0" />}
 <div>
 <h4 className="text-xs font-semibold text-white">{t('astro.windWarning', lang)} {Math.round(bestWindow.avgWind)} km/h</h4>
 <p className="text-2xs text-slate-400 mt-0.5 leading-relaxed">
 {bestWindow.avgWind > 20 ? t('astro.windHigh', lang) : t('astro.windLow', lang)}
 </p>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-slate-800/30 border border-rose-900/30 p-5 rounded-xl text-center">
 <p className="text-rose-400 text-xs font-semibold">{t('astro.noGoodTime', lang)}</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
