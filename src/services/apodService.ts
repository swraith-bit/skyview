import { LangCode, t } from '../i18n';
import { fetchJsonWithTimeout } from '../utils/fetchWithTimeout';

export interface APODData {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  date: string;
  copyright?: string;
  isOfflineFallback?: boolean;
}

export class APODFetchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'APODFetchError';
    this.status = status;
  }
}

const encodeOfflineSvg = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

const OFFLINE_APOD_ARTWORK = {
  pillars: encodeOfflineSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
      <defs>
        <radialGradient id="bg1" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="45%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
        <radialGradient id="neb1" cx="55%" cy="55%" r="50%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.55"/>
          <stop offset="45%" stop-color="#ec4899" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg1)"/>
      <circle cx="660" cy="495" r="440" fill="url(#neb1)"/>
      <path d="M350 900 C370 640 430 470 460 280 C490 470 530 660 560 900 Z" fill="#1e293b" opacity="0.85"/>
      <path d="M540 900 C560 680 610 520 640 340 C670 520 710 680 735 900 Z" fill="#334155" opacity="0.78"/>
      <path d="M720 900 C740 730 775 600 800 440 C825 600 855 730 880 900 Z" fill="#1e293b" opacity="0.82"/>
      <g fill="#f8fafc">
        <circle cx="180" cy="140" r="2.2"/><circle cx="280" cy="210" r="1.6"/><circle cx="460" cy="160" r="3"/>
        <circle cx="640" cy="220" r="2.4"/><circle cx="820" cy="150" r="2.8"/><circle cx="980" cy="240" r="1.8"/>
        <circle cx="1040" cy="420" r="2.1"/><circle cx="220" cy="520" r="1.9"/><circle cx="520" cy="390" r="2.5"/>
      </g>
    </svg>
  `),
  cliffs: encodeOfflineSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
      <defs>
        <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="50%" stop-color="#0c4a6e"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
        <radialGradient id="glow2" cx="45%" cy="62%" r="55%">
          <stop offset="0%" stop-color="#fb923c" stop-opacity="0.65"/>
          <stop offset="55%" stop-color="#38bdf8" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg2)"/>
      <circle cx="540" cy="560" r="480" fill="url(#glow2)"/>
      <path d="M0 540 Q220 460 420 510 T840 460 T1200 520 L1200 900 L0 900 Z" fill="#7c2d12" opacity="0.72"/>
      <path d="M0 610 Q280 540 540 590 T1020 550 T1200 600 L1200 900 L0 900 Z" fill="#431407" opacity="0.88"/>
      <g fill="#fef08a">
        <circle cx="210" cy="190" r="2.6"/><circle cx="390" cy="130" r="3.2"/><circle cx="670" cy="170" r="2.1"/>
        <circle cx="890" cy="220" r="2.9"/><circle cx="1030" cy="140" r="1.8"/><circle cx="510" cy="310" r="2.4"/>
      </g>
    </svg>
  `),
  andromeda: encodeOfflineSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
      <defs>
        <radialGradient id="bg3" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="55%" stop-color="#090d16"/>
          <stop offset="100%" stop-color="#010204"/>
        </radialGradient>
        <radialGradient id="core3" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="30%" stop-color="#c084fc" stop-opacity="0.75"/>
          <stop offset="70%" stop-color="#38bdf8" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#010204" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg3)"/>
      <g transform="translate(600 450) rotate(-26)">
        <ellipse cx="0" cy="0" rx="460" ry="155" fill="url(#core3)"/>
        <ellipse cx="0" cy="0" rx="340" ry="95" fill="none" stroke="#93c5fd" stroke-opacity="0.35" stroke-width="8"/>
        <ellipse cx="0" cy="0" rx="210" ry="56" fill="none" stroke="#f5d0fe" stroke-opacity="0.5" stroke-width="6"/>
        <circle cx="0" cy="0" r="46" fill="#fef9c3" opacity="0.92"/>
      </g>
      <g fill="#e2e8f0">
        <circle cx="160" cy="180" r="2"/><circle cx="310" cy="690" r="2.4"/><circle cx="940" cy="190" r="2.2"/>
        <circle cx="1020" cy="680" r="1.9"/><circle cx="760" cy="140" r="1.7"/><circle cx="240" cy="390" r="2.1"/>
      </g>
    </svg>
  `),
};

// Shared fallback image set used for all languages (bundled offline SVG artwork, zero external network dependencies)
export const getFallbackImages = (lang: LangCode): APODData[] => [
  {
    title: t('apod.fallback1.title', lang),
    date: '2026-06-09',
    media_type: 'image',
    url: OFFLINE_APOD_ARTWORK.pillars,
    explanation: t('apod.fallback1.explanation', lang),
    copyright: 'NASA/Hubble',
    isOfflineFallback: true,
  },
  {
    title: t('apod.fallback2.title', lang),
    date: '2026-06-08',
    media_type: 'image',
    url: OFFLINE_APOD_ARTWORK.cliffs,
    explanation: t('apod.fallback2.explanation', lang),
    copyright: 'James Webb Space Telescope',
    isOfflineFallback: true,
  },
  {
    title: t('apod.fallback3.title', lang),
    date: '2026-06-07',
    media_type: 'image',
    url: OFFLINE_APOD_ARTWORK.andromeda,
    explanation: t('apod.fallback3.explanation', lang),
    copyright: 'NASA, ESA, CSA, STScI',
    isOfflineFallback: true,
  },
];

export const fetchApod = async (requestedDate: string, signal?: AbortSignal): Promise<APODData> => {
  const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
  // F1.5: pin the device's local day so NASA and the cache agree on which picture is fetched.
  const params = new URLSearchParams({ api_key: apiKey, date: requestedDate });
  const res = await fetchJsonWithTimeout(`https://api.nasa.gov/planetary/apod?${params}`, { signal }, 12_000);
  
  if (!res.ok) {
    throw new APODFetchError(`HTTP ${res.status}`, res.status);
  }

  try {
    // §6 zod ilk-yükleme: şema modülü ilk ağ doğrulamasına kadar geciktirilir.
    const { apodSchema, parseContract } = await import('../schemas/apiSchemas');
    return parseContract('NASA APOD', apodSchema, res.data);
  } catch {
    throw new APODFetchError('INVALID_API_RESPONSE');
  }
};
