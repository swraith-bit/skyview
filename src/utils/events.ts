import { Body, EclipseKind } from 'astronomy-engine';
import { AstroEvent, LocationData } from '../types';
import { LangCode } from '../i18n';
import { formatTimeInTimeZone, getLocalDateParts } from './dateTime';
import { buildShowers, getShowerName, Shower } from './showers';
import { formatMessage } from '../i18nExtra';
// F3.5: the heavy eclipse search and planet sweep moved to the worker-safe
// astroEventSearch module; this file keeps the i18n formatting layer.
import {
  computeAstroEventSearchRaw,
  RawAstroEventSearch,
  RawEclipseEvent,
  RawPlanetApproach,
} from './astroEventSearch';

const supportedLocale: Record<LangCode, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  ar: 'ar',
  it: 'it-IT',
  pt: 'pt-PT'
};

const meteorTitleSuffix: Record<LangCode, string> = {
  en: 'Meteor Shower',
  tr: 'Meteor Yağmuru',
  de: 'Meteorschauer',
  fr: 'Pluie de météores',
  es: 'Lluvia de meteoros',
  ar: 'زخة شهب',
  it: 'Sciame meteorico',
  pt: 'Chuva de meteoros'
};

const zhrLabel: Record<LangCode, string> = {
  en: 'Max meteors per hour',
  tr: 'Maksimum meteor/saat',
  de: 'Maximale Meteore pro Stunde',
  fr: 'Météores max par heure',
  es: 'Meteoros máximos por hora',
  ar: 'أقصى عدد شهب في الساعة',
  it: 'Meteore massime all ora',
  pt: 'Máximo de meteoros por hora'
};

const showerToAstroEvent = (shower: Shower, lang: LangCode): AstroEvent => {
  const showerName = getShowerName(shower.name, lang);
  return {
    date: shower.peak,
    title: `${showerName} ${meteorTitleSuffix[lang] || meteorTitleSuffix.en}`,
    description: `${shower.description[lang] || shower.description.en} ${zhrLabel[lang] || zhrLabel.en}: ${shower.zhr}.`,
    type: 'meteor'
  };
};

const buildMeteorEvents = (lang: LangCode, timeZone?: string, fromDate = new Date()): AstroEvent[] => {
  const currentYear = getLocalDateParts(fromDate, timeZone).year;
  const seen = new Set<string>();

  return [currentYear, currentYear + 1]
    .flatMap(year => buildShowers(year, timeZone))
    .filter(shower => {
      const key = `${shower.name}-${shower.peak.toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(shower => showerToAstroEvent(shower, lang));
};

const eclipseNames: Record<string, Partial<Record<LangCode, string>>> = {
  [`solar-${EclipseKind.Total}`]: {
    en: 'Total Solar Eclipse',
    tr: 'Tam Güneş Tutulması',
    de: 'Totale Sonnenfinsternis',
    fr: 'Éclipse solaire totale',
    es: 'Eclipse solar total',
    ar: 'كسوف كلي للشمس',
    it: 'Eclissi solare totale',
    pt: 'Eclipse solar total'
  },
  [`solar-${EclipseKind.Annular}`]: {
    en: 'Annular Solar Eclipse',
    tr: 'Halkalı Güneş Tutulması',
    de: 'Ringförmige Sonnenfinsternis',
    fr: 'Éclipse solaire annulaire',
    es: 'Eclipse solar anular',
    ar: 'كسوف حلقي للشمس',
    it: 'Eclissi solare anulare',
    pt: 'Eclipse solar anular'
  },
  [`solar-${EclipseKind.Partial}`]: {
    en: 'Partial Solar Eclipse',
    tr: 'Parçalı Güneş Tutulması',
    de: 'Partielle Sonnenfinsternis',
    fr: 'Éclipse solaire partielle',
    es: 'Eclipse solar parcial',
    ar: 'كسوف جزئي للشمس',
    it: 'Eclissi solare parziale',
    pt: 'Eclipse solar parcial'
  },
  [`lunar-${EclipseKind.Total}`]: {
    en: 'Total Lunar Eclipse',
    tr: 'Tam Ay Tutulması',
    de: 'Totale Mondfinsternis',
    fr: 'Éclipse lunaire totale',
    es: 'Eclipse lunar total',
    ar: 'خسوف كلي للقمر',
    it: 'Eclissi lunare totale',
    pt: 'Eclipse lunar total'
  },
  [`lunar-${EclipseKind.Partial}`]: {
    en: 'Partial Lunar Eclipse',
    tr: 'Parçalı Ay Tutulması',
    de: 'Partielle Mondfinsternis',
    fr: 'Éclipse lunaire partielle',
    es: 'Eclipse lunar parcial',
    ar: 'خسوف جزئي للقمر',
    it: 'Eclissi lunare parziale',
    pt: 'Eclipse lunar parcial'
  },
  [`lunar-${EclipseKind.Penumbral}`]: {
    en: 'Penumbral Lunar Eclipse',
    tr: 'Yarı Gölgeli Ay Tutulması',
    de: 'Halbschatten-Mondfinsternis',
    fr: 'Éclipse lunaire pénombrale',
    es: 'Eclipse lunar penumbral',
    ar: 'خسوف شبه ظل للقمر',
    it: 'Eclissi lunare penombrale',
    pt: 'Eclipse lunar penumbral'
  }
};

const text = (values: Partial<Record<LangCode, string>>, lang: LangCode): string => (
  values[lang] || values.en || ''
);

const eventMessages: Record<string, Record<LangCode, string>> = {
  peakPath: { en: ' Peak path is near {lat}, {lon}.', tr: ' En güçlü hat yaklaşık {lat}, {lon}.', de: ' Die Zentrallinie liegt nahe {lat}, {lon}.', fr: ' La trajectoire maximale passe près de {lat}, {lon}.', es: ' La trayectoria máxima pasa cerca de {lat}, {lon}.', ar: ' يقع مسار الذروة قرب {lat}، {lon}.', it: ' Il percorso massimo passa vicino a {lat}, {lon}.', pt: ' A trajetória máxima passa perto de {lat}, {lon}.' },
  solar: { en: 'Calculated global solar eclipse. Peak time: {time}.{where}', tr: 'Küresel güneş tutulması hesabı. Zirve zamanı: {time}.{where}', de: 'Berechnete globale Sonnenfinsternis. Maximum: {time}.{where}', fr: 'Éclipse solaire globale calculée. Maximum : {time}.{where}', es: 'Eclipse solar global calculado. Máximo: {time}.{where}', ar: 'كسوف شمسي عالمي محسوب. وقت الذروة: {time}.{where}', it: 'Eclissi solare globale calcolata. Massimo: {time}.{where}', pt: 'Eclipse solar global calculado. Máximo: {time}.{where}' },
  obscuration: { en: ' Maximum obscuration: {value}%.', tr: ' Maksimum örtülme: %{value}.', de: ' Maximale Bedeckung: {value}%.', fr: ' Obscurcissement maximal : {value} %.', es: ' Oscurecimiento máximo: {value}%.', ar: ' الحد الأقصى للحجب: {value}٪.', it: ' Oscuramento massimo: {value}%.', pt: ' Ocultação máxima: {value}%.' },
  lunar: { en: "Lunar eclipse visible from Earth's night side. Peak time: {time}.{obscuration}", tr: "Dünya'nın gece tarafında görülebilecek ay tutulması. Zirve zamanı: {time}.{obscuration}", de: 'Mondfinsternis auf der Nachtseite der Erde sichtbar. Maximum: {time}.{obscuration}', fr: 'Éclipse lunaire visible depuis le côté nocturne de la Terre. Maximum : {time}.{obscuration}', es: 'Eclipse lunar visible desde el lado nocturno de la Tierra. Máximo: {time}.{obscuration}', ar: 'خسوف قمري مرئي من الجانب الليلي للأرض. وقت الذروة: {time}.{obscuration}', it: 'Eclissi lunare visibile dal lato notturno della Terra. Massimo: {time}.{obscuration}', pt: 'Eclipse lunar visível no lado noturno da Terra. Máximo: {time}.{obscuration}' },
  closeTitle: { en: '{planet}-Moon Close Approach', tr: '{planet}-Ay Yakınlaşması', de: 'Nahe Begegnung von {planet} und Mond', fr: 'Rapprochement {planet}-Lune', es: 'Acercamiento {planet}-Luna', ar: 'اقتراب {planet} من القمر', it: 'Avvicinamento {planet}-Luna', pt: 'Aproximação {planet}-Lua' },
  closeDescription: { en: 'The Moon and {planet} are visible from your location about {separation}° apart. Best check time: {time}.', tr: 'Ay ve {planet}, bulunduğun konumdan yaklaşık {separation}° ayrılıkla görülebilir. En iyi kontrol saati: {time}.', de: 'Mond und {planet} sind von deinem Standort etwa {separation}° voneinander entfernt. Beste Zeit: {time}.', fr: 'La Lune et {planet} sont séparés d’environ {separation}° depuis votre position. Meilleure heure : {time}.', es: 'La Luna y {planet} se ven separados unos {separation}° desde tu ubicación. Mejor hora: {time}.', ar: 'يظهر القمر و{planet} بفاصل يقارب {separation}° من موقعك. أفضل وقت: {time}.', it: 'La Luna e {planet} sono separati di circa {separation}° dalla tua posizione. Ora migliore: {time}.', pt: 'A Lua e {planet} estão separados cerca de {separation}° a partir da sua localização. Melhor hora: {time}.' },
};

const eventText = (key: keyof typeof eventMessages, lang: LangCode, values: Record<string, string | number>) => (
  formatMessage(eventMessages[key]?.[lang] || eventMessages[key]?.en || '', values)
);

const formatCoord = (value: number | undefined, positive: string, negative: string): string | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const label = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(1)}°${label}`;
};

const eclipseDescription = (
  kind: 'solar' | 'lunar',
  lang: LangCode,
  timeZone: string | undefined,
  date: Date,
  details?: { latitude?: number; longitude?: number; obscuration?: number },
): string => {
  const locale = supportedLocale[lang] || supportedLocale.en;
  const timeLabel = formatTimeInTimeZone(date, locale, timeZone);

  if (kind === 'solar') {
    const lat = formatCoord(details?.latitude, 'N', 'S');
    const lon = formatCoord(details?.longitude, 'E', 'W');
    const where = lat && lon ? eventText('peakPath', lang, { lat, lon }) : '';
    return eventText('solar', lang, { time: timeLabel, where });
  }

  const obscuration = typeof details?.obscuration === 'number'
    ? eventText('obscuration', lang, { value: Math.round(details.obscuration * 100) })
    : '';
  return eventText('lunar', lang, { time: timeLabel, obscuration });
};

const formatEclipseEvent = (raw: RawEclipseEvent, lang: LangCode, timeZone?: string): AstroEvent => {
  const key = `${raw.kind}-${raw.eclipseKind}`;
  const fallbackKey = raw.kind === 'solar'
    ? `solar-${EclipseKind.Partial}`
    : `lunar-${EclipseKind.Penumbral}`;
  const date = new Date(raw.dateMs);
  const names = eclipseNames[key] ?? eclipseNames[fallbackKey] ?? {};
  return {
    date,
    title: text(names, lang),
    description: raw.kind === 'solar'
      ? eclipseDescription('solar', lang, timeZone, date, {
          latitude: raw.latitude,
          longitude: raw.longitude,
          obscuration: raw.obscuration
        })
      : eclipseDescription('lunar', lang, timeZone, date, {
          obscuration: raw.obscuration
        }),
    type: 'eclipse'
  };
};

const planetNames: Record<Body, Partial<Record<LangCode, string>>> = {
  [Body.Mercury]: {
    en: 'Mercury',
    tr: 'Merkür',
    de: 'Merkur',
    fr: 'Mercure',
    es: 'Mercurio',
    ar: 'عطارد',
    it: 'Mercurio',
    pt: 'Mercúrio'
  },
  [Body.Venus]: {
    en: 'Venus',
    tr: 'Venüs',
    de: 'Venus',
    fr: 'Vénus',
    es: 'Venus',
    ar: 'الزهرة',
    it: 'Venere',
    pt: 'Vênus'
  },
  [Body.Mars]: {
    en: 'Mars',
    tr: 'Mars',
    de: 'Mars',
    fr: 'Mars',
    es: 'Marte',
    ar: 'المريخ',
    it: 'Marte',
    pt: 'Marte'
  },
  [Body.Jupiter]: {
    en: 'Jupiter',
    tr: 'Jüpiter',
    de: 'Jupiter',
    fr: 'Jupiter',
    es: 'Júpiter',
    ar: 'المشتري',
    it: 'Giove',
    pt: 'Júpiter'
  },
  [Body.Saturn]: {
    en: 'Saturn',
    tr: 'Satürn',
    de: 'Saturn',
    fr: 'Saturne',
    es: 'Saturno',
    ar: 'زحل',
    it: 'Saturno',
    pt: 'Saturno'
  },
  [Body.Sun]: {},
  [Body.Moon]: {},
  [Body.Earth]: {},
  [Body.Uranus]: {},
  [Body.Neptune]: {},
  [Body.Pluto]: {},
  [Body.SSB]: {},
  [Body.EMB]: {},
  [Body.Star1]: {},
  [Body.Star2]: {},
  [Body.Star3]: {},
  [Body.Star4]: {},
  [Body.Star5]: {},
  [Body.Star6]: {},
  [Body.Star7]: {},
  [Body.Star8]: {}
};

const formatPlanetApproach = (raw: RawPlanetApproach, lang: LangCode, timeZone?: string): AstroEvent => {
  const planetName = text(planetNames[raw.body as Body], lang);
  const locale = supportedLocale[lang] || supportedLocale.en;
  const date = new Date(raw.dateMs);
  const timeLabel = formatTimeInTimeZone(date, locale, timeZone);
  return {
    date,
    title: eventText('closeTitle', lang, { planet: planetName }),
    description: eventText('closeDescription', lang, { planet: planetName, separation: raw.separation.toFixed(1), time: timeLabel }),
    type: 'planet' as const
  };
};

// F3.5: formats raw worker output (plain serializable rows) into localized
// AstroEvents. Exported for the query hook that receives worker replies.
export function formatAstroEventSearch(
  search: RawAstroEventSearch,
  lang: LangCode,
  timeZone?: string,
): AstroEvent[] {
  return [
    ...search.eclipses.map(eclipse => formatEclipseEvent(eclipse, lang, timeZone)),
    ...search.approaches.map(approach => formatPlanetApproach(approach, lang, timeZone))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getAstroEvents(lang: LangCode, timeZone?: string, fromDate = new Date(), location?: LocationData): AstroEvent[] {
  const search = computeAstroEventSearchRaw(fromDate, timeZone, location);
  return [
    ...buildMeteorEvents(lang, timeZone, fromDate),
    ...formatAstroEventSearch(search, lang, timeZone)
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Helper to calculate great-circle distance between two points in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Major cities (heavy light pollution -> Bortle 8-9)
const CITIES = [
  { lat: 41.0082, lng: 28.9784, name: 'Istanbul' },
  { lat: 39.9334, lng: 32.8597, name: 'Ankara' },
  { lat: 38.4237, lng: 27.1428, name: 'Izmir' },
  { lat: 36.8969, lng: 30.7133, name: 'Antalya' },
  { lat: 51.5074, lng: -0.1278, name: 'London' },
  { lat: 40.7128, lng: -74.0060, name: 'New York' },
  { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
  { lat: 25.2048, lng: 55.2708, name: 'Dubai' },
  { lat: 48.8566, lng: 2.3522, name: 'Paris' },
  { lat: 40.4168, lng: -3.7038, name: 'Madrid' },
  { lat: 41.9028, lng: 12.4964, name: 'Rome' },
  { lat: 38.7223, lng: -9.1393, name: 'Lisbon' },
  { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
  { lat: 30.0444, lng: 31.2357, name: 'Cairo' },
  { lat: 24.7136, lng: 46.6753, name: 'Riyadh' }
  ,{ lat: 34.0522, lng: -118.2437, name: 'Los Angeles' }
  ,{ lat: 41.8781, lng: -87.6298, name: 'Chicago' }
  ,{ lat: 19.0760, lng: 72.8777, name: 'Mumbai' }
  ,{ lat: 28.6139, lng: 77.2090, name: 'Delhi' }
  ,{ lat: 31.2304, lng: 121.4737, name: 'Shanghai' }
  ,{ lat: 39.9042, lng: 116.4074, name: 'Beijing' }
  ,{ lat: 37.5665, lng: 126.9780, name: 'Seoul' }
  ,{ lat: 1.3521, lng: 103.8198, name: 'Singapore' }
  ,{ lat: -33.8688, lng: 151.2093, name: 'Sydney' }
  ,{ lat: -37.8136, lng: 144.9631, name: 'Melbourne' }
  ,{ lat: -23.5505, lng: -46.6333, name: 'Sao Paulo' }
  ,{ lat: 19.4326, lng: -99.1332, name: 'Mexico City' }
  ,{ lat: -34.6037, lng: -58.3816, name: 'Buenos Aires' }
  ,{ lat: 6.5244, lng: 3.3792, name: 'Lagos' }
  ,{ lat: -1.2921, lng: 36.8219, name: 'Nairobi' }
  ,{ lat: 55.7558, lng: 37.6173, name: 'Moscow' }
];

// Stargazing parks & observatories (pristine dark sky -> Bortle 1-2)
const DARK_SITES = [
  { lat: 37.9813, lng: 38.7410, name: 'Nemrut Mountain' },
  { lat: 38.6431, lng: 34.8289, name: 'Cappadocia' },
  { lat: 28.3000, lng: -16.5000, name: 'Teide Observatory (Tenerife)' },
  { lat: -24.6275, lng: -70.4042, name: 'Paranal Observatory (Chile)' },
  { lat: 19.8250, lng: -155.4742, name: 'Mauna Kea (Hawaii)' },
  { lat: 34.3647, lng: -116.5011, name: 'Joshua Tree (USA)' },
  { lat: 30.7411, lng: 35.3475, name: 'Feynan (Jordan)' }
];

// F3.6: memoized per ~111 m-rounded coordinate — the heuristic loops over the
// city/dark-site tables and was recomputed on every render/fetch for the same
// spot. The cache is capped to keep long sessions bounded.
const bortleCache = new Map<string, number>();
const BORTLE_CACHE_LIMIT = 256;

const computeBortleScale = (lat: number, lng: number): number => {
  let minCityDist = Infinity;
  CITIES.forEach(c => {
    const d = getDistance(lat, lng, c.lat, c.lng);
    if (d < minCityDist) minCityDist = d;
  });

  let minDarkDist = Infinity;
  DARK_SITES.forEach(s => {
    const d = getDistance(lat, lng, s.lat, s.lng);
    if (d < minDarkDist) minDarkDist = d;
  });

  // Unknown regions should not be advertised as pristine dark sky merely
  // because the nearest city is absent from this heuristic data set.
  let scale = 5;
  if (minCityDist < 12) {
    scale = 9;
  } else if (minCityDist < 30) {
    scale = 8;
  } else if (minCityDist < 55) {
    scale = 6;
  } else if (minCityDist < 90) {
    scale = 5;
  } else if (minCityDist < 140) {
    scale = 4;
  } else if (minCityDist < 220) {
    scale = 3;
  } else {
    scale = 4;
  }

  // Dark sky sites override
  if (minDarkDist < 15) {
    scale = 1;
  } else if (minDarkDist < 45 && scale > 2) {
    scale = 2;
  }

  return scale;
};

// Deterministic distance-based heuristic mapping to estimate realistic Bortle Scale indices
export function estimateBortleScale(lat: number, lng: number): number {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = bortleCache.get(key);
  if (cached !== undefined) return cached;
  const scale = computeBortleScale(lat, lng);
  if (bortleCache.size >= BORTLE_CACHE_LIMIT) bortleCache.clear();
  bortleCache.set(key, scale);
  return scale;
}
