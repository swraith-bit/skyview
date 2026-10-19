import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Sliders, MapPin, Check, Search, Loader2, ExternalLink, Navigation } from 'lucide-react';
import { LocationData } from '../../types';
import { estimateBortleScale } from '../../utils/events';
import { LangCode, t } from '../../i18n';
import { Geolocation } from '@capacitor/geolocation';
import { getBortleInfo } from '../../utils/bortle';
import { resolveTimezoneForCoordinates } from '../../utils/locationTimezone';
import { searchLocations } from '../../services/geocodingService';
import { localizeCompassCode } from '../../utils/compassLabels';

const CUSTOM_MARKER_ICON = L.divIcon({
 className: 'custom-pulse-marker',
 html: `
 <div class="relative w-8 h-8 flex items-center justify-center">
 <div class="absolute w-8 h-8 bg-indigo-500 rounded-full opacity-20"></div>
 <div class="relative w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-[0_0_12px_rgba(99,102,241,1)]"></div>
 </div>
 `,
 iconSize: [32, 32],
 iconAnchor: [16, 16]
});

interface LightPollutionMapProps {
 currentLocation: LocationData;
 lang: LangCode;
 onClose: () => void;
 onLocationSelect: (location: LocationData) => void;
}

export const LightPollutionMap: React.FC<LightPollutionMapProps> = ({
 currentLocation,
 lang,
 onClose,
 onLocationSelect,
}) => {
 const mapContainerRef = useRef<HTMLDivElement>(null);
 const mapRef = useRef<L.Map | null>(null);
 const markerRef = useRef<L.Marker | null>(null);
 const overlayRef = useRef<L.TileLayer | null>(null);
 const initialLocationRef = useRef({
 lat: currentLocation.latitude,
 lng: currentLocation.longitude,
 });
 const initialOpacityRef = useRef(0.65);

 const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
 lat: currentLocation.latitude,
 lng: currentLocation.longitude,
 });

 const [opacity, setOpacity] = useState<number>(0.65);
 const [searchQuery, setSearchQuery] = useState<string>('');
 const [searchResults, setSearchResults] = useState<LocationData[]>([]);
 const [searchLoading, setSearchLoading] = useState<boolean>(false);
 const [showDropdown, setShowDropdown] = useState<boolean>(false);
 const [gpsLoading, setGpsLoading] = useState<boolean>(false);
 const [selectionLoading, setSelectionLoading] = useState<boolean>(false);

 // F5.5: modal yüzeyi uçuş sırasında kapatılabilir (GPS/zaman-dilimi/arama
 // bekleme çağrıları beklerken unmount); unmount sonrası state yazımları burada
 // korunur.
 const isMountedRef = useRef(true);
 useEffect(() => {
   isMountedRef.current = true;
   return () => {
     isMountedRef.current = false;
   };
 }, []);

  const handleGoToCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          resetToInitialLocation();
          return;
        }
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 6000 });
      if (!isMountedRef.current) return;
      const lat = Number(pos.coords.latitude.toFixed(4));
      const lng = Number(pos.coords.longitude.toFixed(4));
      setSelectedCoords({ lat, lng });
      if (mapRef.current && markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.flyTo([lat, lng], 10);
      }
    } catch (err) {
      console.warn('Geolocation error:', err);
      resetToInitialLocation();
    } finally {
      if (isMountedRef.current) setGpsLoading(false);
    }
  };

 const resetToInitialLocation = () => {
 if (!isMountedRef.current) return;
 const lat = currentLocation.latitude;
 const lng = currentLocation.longitude;
 setSelectedCoords({ lat, lng });
 if (mapRef.current && markerRef.current) {
 markerRef.current.setLatLng([lat, lng]);
 mapRef.current.flyTo([lat, lng], 10);
 }
 };

 const bortleVal = estimateBortleScale(selectedCoords.lat, selectedCoords.lng);
 const bortleInfo = getBortleInfo(bortleVal, lang);

 // Map Initialization
 useEffect(() => {
 const container = mapContainerRef.current;
 if (!container) return;
 const initialLocation = initialLocationRef.current;

 if (!mapRef.current) {
 const map = L.map(container, {
 center: [initialLocation.lat, initialLocation.lng],
 zoom: 7,
 zoomControl: false,
 maxZoom: 12,
 minZoom: 2,
 });

 mapRef.current = map;

 // Add Zoom Control to the top-right
 L.control.zoom({ position: 'topright' }).addTo(map);

 // Base vector layer: CartoDB Dark Matter
 L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
 attribution: '&copy; OpenStreetMap &copy; CARTO',
 subdomains: 'abcd',
 maxZoom: 20
 }).addTo(map);

 // NASA GIBS Black Marble Layer
 const gibsLayer = L.tileLayer(
 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-12-31/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png',
 {
 attribution: 'NASA EOSDIS GIBS',
 opacity: initialOpacityRef.current,
 maxZoom: 8,
 bounds: [
 [-85.0511287, -180],
 [85.0511287, 180]
 ]
 }
 ).addTo(map);

 overlayRef.current = gibsLayer;

 // Marker
 const marker = L.marker([initialLocation.lat, initialLocation.lng], {
 icon: CUSTOM_MARKER_ICON,
 draggable: true
 }).addTo(map);

 markerRef.current = marker;

 // Drag listener
 marker.on('dragend', () => {
 const latLng = marker.getLatLng();
 setSelectedCoords({ lat: Number(latLng.lat.toFixed(4)), lng: Number(latLng.lng.toFixed(4)) });
 });

 // Click listener
 map.on('click', (e) => {
 const { lat, lng } = e.latlng;
 marker.setLatLng([lat, lng]);
 setSelectedCoords({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) });
 map.panTo([lat, lng]);
 });
 }

 // F5.5: container boyutları pencere-resize olmadan da değişir (dönüş §C.8,
 // mount animasyonu, overlay'ler) — ResizeObserver ile invalidateSize.
 const resizeObserver = typeof ResizeObserver === 'undefined'
   ? null
   : new ResizeObserver(() => {
     mapRef.current?.invalidateSize();
   });
 if (resizeObserver) resizeObserver.observe(container);

 return () => {
 resizeObserver?.disconnect();
 if (mapRef.current) {
 mapRef.current.remove();
 mapRef.current = null;
 }
 };
 }, []);

 // Update opacity dynamically
 useEffect(() => {
 if (overlayRef.current) {
 overlayRef.current.setOpacity(opacity);
 }
 }, [opacity]);

 // Autocomplete Search inside Map
 useEffect(() => {
 if (!searchQuery.trim()) {
 setSearchResults([]);
 setShowDropdown(false);
 return;
 }

 const controller = new AbortController();
 const delayDebounceFn = setTimeout(async () => {
 if (!isMountedRef.current) return;
 setSearchLoading(true);
 setShowDropdown(true);
 try {
 setSearchResults(await searchLocations(searchQuery, lang, controller.signal, 5));
 } catch {
 if (isMountedRef.current) setSearchResults([]);
 } finally {
 if (isMountedRef.current) setSearchLoading(false);
 }
 }, 400);

 return () => {
 clearTimeout(delayDebounceFn);
 controller.abort();
 };
 }, [searchQuery, lang]);

 const handleSelectSearch = (loc: LocationData) => {
 setSelectedCoords({ lat: loc.latitude, lng: loc.longitude });
 setShowDropdown(false);
 setSearchQuery('');
 
 if (mapRef.current && markerRef.current) {
 markerRef.current.setLatLng([loc.latitude, loc.longitude]);
 mapRef.current.flyTo([loc.latitude, loc.longitude], 9);
 }
 };

 const handleSelectLocation = async () => {
 setSelectionLoading(true);
 const timezone = await resolveTimezoneForCoordinates(selectedCoords.lat, selectedCoords.lng);
 if (!isMountedRef.current) return;
 onLocationSelect({
 name: t('lpm2.selectedPoint', lang),
 latitude: selectedCoords.lat,
  longitude: selectedCoords.lng,
  timezone,
 });
 setSelectionLoading(false);
 onClose();
 };

 return (
 // F5.4: kabuk (fixed inset-0, perde, safe-area, animasyon, odak tuzağı, F5.3
 // geri-tuşu kaydı) StandardModal fullscreen varyantında; burada yalnızca içerik.
 <>
 {/* Header */}
 <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-white/5 bg-app-panel/90 backdrop-blur-xl">
 <div className="min-w-0">
 <h2 className="text-base sm:text-lg font-black font-display tracking-tight text-white flex items-center gap-2 break-words">
 <MapPin className="w-5 h-5 text-indigo-400" />
 {t('lightPollutionMap.title', lang)}
 </h2>
 <p className="text-2xs text-slate-400 font-medium mt-0.5 max-w-sm sm:max-w-none">
 {t('lightPollutionMap.instructions', lang)}
 </p>
 </div>
 <button
 onClick={onClose}
 aria-label={t('common.close', lang)}
 className="shrink-0 w-11 h-11 rounded-xl border border-white/5 bg-slate-800/30 text-slate-400 hover:text-white hover:border-white/5 transition-all outline-none flex items-center justify-center"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Map Content Container */}
 <div className="flex-1 relative">
 <div ref={mapContainerRef} className="w-full h-full bg-app-bg" />

 {/* Floating Top-Left Search Bar */}
 <div className="absolute top-4 left-4 z-[1000] w-[calc(100%-3rem)] max-w-[250px] xs:max-w-xs sm:max-w-sm">
 <div className="relative">
 <div className="flex gap-1.5 p-1 bg-slate-900/80 border border-white/10 backdrop-blur-xl rounded-xl shadow-sm items-center">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder={t('obs.searchPlaceholder', lang)}
 aria-label={t('obs.searchPlaceholder', lang)}
 className="w-full bg-transparent text-white pl-3 pr-2 py-1.5 text-xs outline-none"
 />
 <div className="shrink-0 p-1.5 text-indigo-400 flex items-center justify-center" aria-hidden="true">
 {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
 </div>
 

 </div>

 {showDropdown && searchResults.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-1.5 bg-app-panel-raised border border-white/5 rounded-xl shadow-sm overflow-hidden max-h-48 overflow-y-auto">
 {searchResults.map((res, i) => (
 <button
 key={i}
 type="button"
 onClick={() => handleSelectSearch(res)}
 className="w-full text-left px-3.5 py-2.5 text-xs-plus text-slate-300 hover:bg-indigo-600/20 flex gap-2 border-b border-white/5 last:border-0 transition-colors"
 >
 <MapPin className="w-3.5 h-3.5 text-indigo-400" />
 {res.name}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Floating Bottom Info Panel & Map Controls */}
 <div className="absolute bottom-4 left-4 right-4 z-[1000] mx-auto max-w-md flex flex-col items-end gap-3 pointer-events-none">
 
 {/* GPS Locate Button (Floating Action Button) */}
 <button
 type="button"
 onClick={handleGoToCurrentLocation}
 disabled={gpsLoading}
 aria-label={t('lpm2.goToLocation', lang)}
 className="pointer-events-auto w-10 h-10 bg-app-panel/90 border border-white/5 backdrop-blur-xl rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 transition-all outline-none"
 title={t('lpm2.goToLocation', lang)}
 >
 {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5 rotate-45 -ml-0.5 mt-0.5" />}
 </button>

 <div className="pointer-events-auto w-full bg-app-panel/95 border border-white/5 backdrop-blur-xl rounded-xl p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex flex-col gap-2">
 
 {/* Bortle & Location Data */}
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-0.5 flex-1 min-w-0">
 <span className="text-4xs font-semibold text-indigo-400 uppercase tracking-widest block">
 {t('lightPollutionMap.bortleClass', lang)}
 </span>
 <h3 className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${bortleInfo.color}`}>
  {t('obs.estimated', lang)} Bortle {bortleVal} — {bortleInfo.rating}
 </h3>
 <p className="text-3xs text-slate-400 leading-tight font-medium">
 {bortleInfo.advice}
 </p>
 </div>

 {/* Coordinates Indicator */}
 <div className="shrink-0 text-right font-mono text-3xs text-slate-500 flex flex-col items-end">
 <span className="block font-semibold text-slate-400 uppercase tracking-wide text-4xs mb-0.5">
 {t('lightPollutionMap.coordinate', lang)}
 </span>
 <span className="text-slate-300 leading-none">{Math.abs(selectedCoords.lat).toFixed(4)}°{localizeCompassCode(selectedCoords.lat >= 0 ? 'N' : 'S', lang)}</span>
 <span className="text-slate-300 leading-none mt-0.5">{Math.abs(selectedCoords.lng).toFixed(4)}°{localizeCompassCode(selectedCoords.lng >= 0 ? 'E' : 'W', lang)}</span>
 <a
 href={`https://www.google.com/maps/search/?api=1&query=${selectedCoords.lat},${selectedCoords.lng}`}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-1 flex items-center gap-0.5 text-4xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-all"
 title={t('lpm2.openGMaps', lang)}
 >
 <span>Maps</span>
 <ExternalLink className="w-2 h-2" />
 </a>
 </div>
 </div>

 {/* Controls Row (Opacity Slider & Select Button side by side) */}
 <div className="flex flex-col min-[360px]:flex-row items-stretch min-[360px]:items-center gap-2 mt-0.5">
 {/* Opacity Slider */}
 <div className="flex-1 flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-900/60">
 <Sliders className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
 <div className="flex-1 flex flex-col justify-center">
 <div className="flex justify-between text-5xs font-semibold text-slate-500 uppercase tracking-wider leading-none mb-0.5">
 <span>{t('lightPollutionMap.opacity', lang)}</span>
 <span>%{(opacity * 100).toFixed(0)}</span>
 </div>
 <input
 type="range"
 min="0"
 max="100"
 value={opacity * 100}
 onChange={(e) => setOpacity(Number(e.target.value) / 100)}
 aria-label={t('lightPollutionMap.opacity', lang)}
 className="w-full accent-indigo-500 cursor-pointer h-0.5 bg-slate-800 rounded-lg appearance-none"
 />
 </div>
 </div>

 {/* Action Button */}
 <button
 onClick={handleSelectLocation}
 disabled={selectionLoading}
 className="min-h-11 px-3 bg-indigo-600 hover:bg-indigo-500 border border-white/5 text-white font-semibold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1 min-[360px]:shrink-0"
 >
 <Check className="w-3 h-3" />
 <span>{t('lightPollutionMap.selectLocation', lang)}</span>
 </button>
 </div>
 
 </div>
 </div>
 </div>
 </>
 );
};
