import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AlertCircle, Orbit, RefreshCw, Satellite } from 'lucide-react';
import { ecfToLookAngles, eciToEcf, eciToGeodetic, gstime, propagate, twoline2satrec } from 'satellite.js';
import { useAppStore } from '../../store/useAppStore';
import { LocationData } from '../../types';
import { DataFreshness } from '../../components/ui/DataFreshness';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconButton } from '../../components/ui/Surface';
import { CelesTrakObject, fetchSatelliteCatalog, getTleEpochMs } from '../../services/satelliteService';

export const DEFAULT_TLE_FRESH_HOURS = 72;

interface SatellitePosition {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  elevation: number;
  range: number;
}

const calculatePosition = (item: CelesTrakObject, date: Date, observerLocation: LocationData): SatellitePosition | null => {
  const satrec = twoline2satrec(item.TLE_LINE1, item.TLE_LINE2);
  const result = propagate(satrec, date);
  if (!result.position || typeof result.position === 'boolean') return null;
  const siderealTime = gstime(date);
  const coordinates = eciToGeodetic(result.position, siderealTime);
  const look = ecfToLookAngles({
    longitude: observerLocation.longitude * Math.PI / 180,
    latitude: observerLocation.latitude * Math.PI / 180,
    height: 0,
  }, eciToEcf(result.position, siderealTime));
  return {
    id: item.NORAD_CAT_ID,
    name: item.OBJECT_NAME,
    latitude: coordinates.latitude * 180 / Math.PI,
    longitude: coordinates.longitude * 180 / Math.PI,
    altitude: coordinates.height,
    elevation: look.elevation * 180 / Math.PI,
    range: look.rangeSat,
  };
};

/** F4.4: small badge text/file strings for the TLE-epoch age pill. */
const tleAgeLabels: Record<'fresh' | 'stale', Record<string, string>> = {
  fresh: {
    tr: 'TLE verisi güncel', en: 'TLE data fresh', de: 'TLE-Daten aktuell',
    fr: 'Données TLE récentes', es: 'Datos TLE recientes', ar: 'بيانات TLE حديثة',
    it: 'Dati TLE recenti', pt: 'Dados TLE recentes',
  },
  stale: {
    tr: 'TLE verisi eski', en: 'TLE data old', de: 'TLE-Daten alt',
    fr: 'Données TLE anciennes', es: 'Datos TLE antiguos', ar: 'بيانات TLE قديمة',
    it: 'Dati TLE vecchi', pt: 'Dados TLE antigos',
  },
};

const LiveSatelliteList: React.FC<{ tleData: CelesTrakObject[] }> = ({ tleData }) => {
  const { lang, currentLocation: location } = useAppStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const positions = useMemo(
    () => tleData.map(item => calculatePosition(item, now, location)).filter((item): item is SatellitePosition => Boolean(item)),
    [tleData, now, location],
  );

  // F4.4: surface TLE staleness instead of drawing old epoches silently.
  const tleAges = useMemo(() => {
    const ages = new Map<number, { text: string; fresh: boolean }>();
    tleData.forEach(item => {
      const epochMs = getTleEpochMs(item.TLE_LINE1);
      if (epochMs === null) return;
      const hours = Math.max(0, (now.getTime() - epochMs) / 3_600_000);
      const fresh = hours <= DEFAULT_TLE_FRESH_HOURS;
      ages.set(item.NORAD_CAT_ID, {
        text: hours < 48 ? `${Math.round(hours)} h` : `${Math.round(hours / 24)} d`,
        fresh,
      });
    });
    return ages;
  }, [tleData, now]);

  if (tleData.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {positions.map(position => {
        const age = tleAges.get(position.id);
        return (
        <article key={position.id} className="rounded-lg border border-white/10 bg-slate-900/45 p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center"><Satellite className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold text-white">{position.name}</h3>
              <p className="text-sm text-slate-400">
                NORAD {position.id}
                {age && (
                  <span
                    className={`ml-2 text-2xs font-medium px-1.5 py-0.5 rounded-full border ${age.fresh ? 'text-emerald-400/90 border-emerald-500/25' : 'text-amber-400 border-amber-500/35'}`}
                    title={tleAgeLabels[age.fresh ? 'fresh' : 'stale'][lang] || tleAgeLabels[age.fresh ? 'fresh' : 'stale'].en}
                  >
                    TLE −{age.text}
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className={`mt-3 text-xs font-medium ${position.elevation > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
            {position.elevation > 0
              ? { tr: `Ufkun üzerinde ${position.elevation.toFixed(1)}°`, en: `${position.elevation.toFixed(1)}° above the horizon`, de: `${position.elevation.toFixed(1)}° über dem Horizont`, fr: `${position.elevation.toFixed(1)}° au-dessus de l'horizon`, es: `${position.elevation.toFixed(1)}° sobre el horizonte`, ar: `${position.elevation.toFixed(1)}° فوق الأفق`, it: `${position.elevation.toFixed(1)}° sopra l'orizzonte`, pt: `${position.elevation.toFixed(1)}° acima do horizonte` }[lang] || `${position.elevation.toFixed(1)}° above the horizon`
              : { tr: 'Şu anda ufkun altında', en: 'Currently below the horizon', de: 'Derzeit unter dem Horizont', fr: 'Actuellement sous l\'horizon', es: 'Actualmente bajo el horizonte', ar: 'حاليا تحت الأفق', it: 'Attualmente sotto l\'orizzonte', pt: 'Atualmente abaixo do horizonte' }[lang] || 'Currently below the horizon' }
          </p>
          <dl className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><dt className="text-xs text-slate-500">{ { tr: 'Yükseklik', en: 'Elevation', de: 'Höhe', fr: 'Élévation', es: 'Elevación', ar: 'ارتفاع', it: 'Elevazione', pt: 'Elevação' }[lang] || 'Elevation' }</dt><dd className="text-sm text-white">{position.elevation.toFixed(1)}°</dd></div>
            <div><dt className="text-xs text-slate-500">{ { tr: 'Menzil', en: 'Range', de: 'Reichweite', fr: 'Gamme', es: 'Rango', ar: 'نطاق', it: 'Gamma', pt: 'Alcance' }[lang] || 'Range' }</dt><dd className="text-sm text-white">{position.range.toFixed(0)} km</dd></div>
            <div><dt className="text-xs text-slate-500">{ { tr: 'İrtifa', en: 'Altitude', de: 'Höhe', fr: 'Altitude', es: 'Altitud', ar: 'ارتفاع', it: 'Altitudine', pt: 'Altitude' }[lang] || 'Altitude' }</dt><dd className="text-sm text-white">{position.altitude.toFixed(0)} km</dd></div>
          </dl>
        </article>
        );
      })}
    </div>
  );
};

export const SatelliteTracker: React.FC = () => {
  const { lang } = useAppStore();
  const [tleData, setTleData] = useState<CelesTrakObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number>();
  const [offlineCache, setOfflineCache] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(false);
    try {
      const result = await fetchSatelliteCatalog(controller.signal);
      if (requestRef.current !== controller) return;
      setTleData(result.data);
      setFetchedAt(result.fetchedAt);
      setOfflineCache(result.offline);
    } catch (reason) {
      // Replaced and unmounted requests must not overwrite newer UI state.
      // A timeout belongs to the active request and must still use the cache/error path.
      if (requestRef.current !== controller) return;
      console.warn('Satellite catalog unavailable', reason);
      setError(true);
    } finally {
      if (requestRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [load]);

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Orbit className="w-5 h-5 text-sky-400" />{ { tr: 'Uydu Takibi', en: 'Satellite Tracking', de: 'Satellitenortung', fr: 'Suivi des satellites', es: 'Rastreo de satélites', ar: 'تتبع الأقمار الصناعية', it: 'Tracciamento satellitare', pt: 'Rastreamento de satélites' }[lang] || 'Satellite Tracking' }</h2>
          <p className="text-sm text-slate-400">{ { tr: 'CelesTrak yörünge verilerinden anlık konumlar.', en: 'Live positions calculated from CelesTrak orbital data.', de: 'Live-Positionen berechnet aus CelesTrak-Bahndaten.', fr: 'Positions en direct calculées à partir des données orbitales CelesTrak.', es: 'Posiciones en vivo calculadas a partir de datos orbitales de CelesTrak.', ar: 'تم حساب المواقف الحية من البيانات المدارية CelesTrak.', it: 'Posizioni in tempo reale calcolate dai dati orbitali CelesTrak.', pt: 'Posições ao vivo calculadas a partir de dados orbitais CelesTrak.' }[lang] || 'Live positions calculated from CelesTrak orbital data.' }</p>
          {fetchedAt && <DataFreshness className="mt-2" fetchedAt={fetchedAt} source="CelesTrak" offline={offlineCache} lang={lang} />}
        </div>
        <IconButton onClick={load} aria-label={ { tr: 'Yenile', en: 'Refresh', de: 'Aktualisieren', fr: 'Actualiser', es: 'Actualizar', ar: 'تحديث', it: 'Aggiorna', pt: 'Atualizar' }[lang] || 'Refresh' } className="text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </IconButton>
      </div>
      {error && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          { { tr: 'Uydu kataloğu alınamadı. ISS ekranı kullanılmaya devam edebilir.', en: 'Satellite catalog is unavailable. ISS tracking remains available.', de: 'Satellitenkatalog nicht verfügbar. ISS-Verfolgung bleibt verfügbar.', fr: 'Catalogue de satellites indisponible. Le suivi de l\'ISS reste disponible.', es: 'Catálogo de satélites no disponible. El seguimiento de la ISS sigue disponible.', ar: 'كتالوج الأقمار الصناعية غير متوفر. تتبع ISS لا يزال متاحا.', it: 'Catalogo satellitare non disponibile. Il tracciamento ISS rimane disponibile.', pt: 'Catálogo de satélites indisponível. O rastreamento da ISS continua disponível.' }[lang] || 'Satellite catalog is unavailable. ISS tracking remains available.' }
        </div>
      )}
      {!loading && !error && <LiveSatelliteList tleData={tleData} />}
      {!loading && !error && tleData.length === 0 && <EmptyState icon={Satellite} message={ { tr: 'İzlenen uydu bulunamadı.', en: 'No tracked satellite found.', de: 'Kein verfolgter Satellit gefunden.', fr: 'Aucun satellite suivi trouvé.', es: 'No se encontró ningún satélite rastreado.', ar: 'لم يتم العثور على قمر صناعي متتبع.', it: 'Nessun satellite tracciato trovato.', pt: 'Nenhum satélite rastreado encontrado.' }[lang] || 'No tracked satellite found.' } />}
    </section>
  );
};
