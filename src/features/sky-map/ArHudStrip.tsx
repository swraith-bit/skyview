import React from 'react';
import { Compass } from 'lucide-react';
import type { LangCode } from '../../i18n';
import { productT } from '../../i18nProduct';
import { getArTranslation } from './arTargets';
import type { TrackingQuality } from '../../hooks/useCompass';

/**
 * F6.4 — AR HUD şeridi (cam-pill):
 *
 * AR açıkken ekranın üst-ortasında FOV / canlı azimut / takip kalitesi üçlüsünü
 * taşir. Azimut hiçbir React state'i ile değil, render döngüsünün yazdığı bir
 * <span> textContent'i üzerinden akar (F3.3 kare-döngüsü ayrımı — kare
 * hızıyla state/re-render üretilmez); FOV ve kalite otoritesi normal React
 * props'udur (dolaylı olarak güncellenir, düşük sıklık).
 *
 * i18n: sıfır yeni anahtar — azimut etiketi arTargets kataloğundan,
 * kalite etiketleri i18nProduct ar.* kataloğundan gelir.
 */
const QUALITY_LABEL_KEY = {
  good: 'ar.qualityGood',
  fair: 'ar.qualityFair',
  poor: 'ar.qualityPoor',
} as const;

export const ArHudStrip: React.FC<{
  lang: LangCode;
  fov: number;
  trackingQuality: TrackingQuality;
  // Kare-döngüsün azimut değerini yazdığı hedef metin düğümü.
  headingTextRef: React.RefObject<HTMLSpanElement | null>;
}> = ({ lang, fov, trackingQuality, headingTextRef }) => {
  const qualityTone = trackingQuality === 'good'
    ? 'text-emerald-300'
    : trackingQuality === 'fair'
      ? 'text-amber-300'
      : 'text-rose-300';
  const dotTone = trackingQuality === 'good'
    ? 'bg-emerald-400'
    : trackingQuality === 'fair'
      ? 'bg-amber-400'
      : 'bg-rose-400';

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2"
      data-testid="ar-hud-strip"
    >
      <div className="flex max-w-[70vw] items-center gap-1.5 overflow-hidden rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-2xs font-semibold shadow-sm backdrop-blur-md">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotTone}`} />
        <span className={`shrink-0 ${qualityTone}`}>
          {productT(QUALITY_LABEL_KEY[trackingQuality], lang)}
        </span>
        <span className="h-3 w-px shrink-0 bg-white/10" />
        <span className="flex shrink-0 items-center gap-1 text-slate-400">
          <Compass className="h-3 w-3 shrink-0" />
          <span className="text-slate-500">{getArTranslation('azimuth', lang)}</span>
          <span ref={headingTextRef} className="tabular-nums text-white">—</span>
          <span aria-hidden="true">°</span>
        </span>
        <span className="h-3 w-px shrink-0 bg-white/10" />
        <span className="shrink-0 tabular-nums text-slate-400">FOV {fov}°</span>
      </div>
    </div>
  );
};
