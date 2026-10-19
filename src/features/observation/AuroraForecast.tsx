import React from 'react';
import { Cloud } from 'lucide-react';
import { LangCode, t } from '../../i18n';
import { useKpIndexQuery } from '../../hooks/queries/useKpIndexQuery';
import { useCountUp } from '../../hooks/useCountUp';
import { KP_HIGH_INDEX, KP_MODERATE_INDEX, KP_STORM_INDEX } from '../../utils/kpThresholds';
import { Panel } from '../../components/ui/Surface';
import { DataFreshness } from '../../components/ui/DataFreshness';

interface AuroraForecastProps {
  lang: LangCode;
}

const estimatedKpLabel: Record<LangCode, string> = {
  en: 'Estimated Kp-Index',
  tr: 'Tahmini Kp-Indeksi',
  de: 'Geschatzter Kp-Index',
  fr: 'Indice Kp estime',
  es: 'Indice Kp estimado',
  ar: 'مؤشر Kp التقديري',
  it: 'Indice Kp stimato',
  pt: 'Indice Kp estimado',
};

const unavailableLabel: Record<LangCode, string> = {
  en: 'Unavailable',
  tr: 'Veri alinamadi',
  de: 'Nicht verfugbar',
  fr: 'Indisponible',
  es: 'No disponible',
  ar: 'غير متاح',
  it: 'Non disponibile',
  pt: 'Indisponivel',
};

export const AuroraForecast: React.FC<AuroraForecastProps> = ({ lang }) => {
  const { data: kpReading, isLoading: kpLoading } = useKpIndexQuery();
  const safeKpIndex = typeof kpReading?.value === 'number' ? kpReading.value : null;
  // F6.7: Kp veri geldikçe 0'dan değil, mevcut görüntüden yumuşak kayar; ilk
  // mount'ta hedefi 0'dır (skeleton → veri) bu yüzden 0→Kp sayımı tek çalışır.
  const kpDisplay = useCountUp(safeKpIndex ?? 0);
  const isHigh = safeKpIndex !== null && safeKpIndex > KP_HIGH_INDEX;
  const isModerate = safeKpIndex !== null && safeKpIndex > KP_MODERATE_INDEX;

  return (
    <Panel muted className="p-4">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
        {t('obs.auroraActivity', lang)}
      </h4>

      <div className="mt-2 text-center py-2 px-4 bg-slate-900/40 rounded-xl border border-slate-700/45">
        <p className="text-xs text-slate-400 font-medium mb-1">
          {estimatedKpLabel[lang] || estimatedKpLabel.en}
        </p>
        {kpLoading ? (
          <div className="flex justify-center my-3" role="status" aria-label="Loading">
            <div className="skeleton-block h-8 w-20" />
          </div>
        ) : (
          <>
            <div className="flex items-end justify-center gap-1.5 mb-1">
              <span className={`text-3xl font-black leading-none ${isHigh ? 'text-rose-500' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
                {safeKpIndex === null ? '—' : kpDisplay.toFixed(1)}
              </span>
              <span className="text-sm text-slate-500 font-semibold mb-0.5">/ 9</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden my-3">
              <div
                className={`h-full bg-gradient-to-r ${safeKpIndex !== null && safeKpIndex >= KP_STORM_INDEX ? 'from-rose-500 to-purple-500' : isModerate ? 'from-amber-400 to-rose-500' : 'from-emerald-400 to-amber-500'}`}
                style={{ width: `${Math.min(100, ((safeKpIndex ?? 0) / 9) * 100)}%` }}
              />
            </div>
            <p className={`text-2xs font-semibold mt-1 uppercase tracking-wider ${isHigh ? 'text-rose-500' : isModerate ? 'text-amber-500' : 'text-emerald-500'}`}>
              {safeKpIndex === null
                ? (unavailableLabel[lang] || unavailableLabel.en)
                : isHigh ? t('obs.auroraHigh', lang) : isModerate ? t('obs.auroraMod', lang) : t('obs.auroraLow', lang)}
            </p>
          </>
        )}
      </div>
      {kpReading && <DataFreshness className="mt-3" fetchedAt={kpReading.fetchedAt} source={kpReading.source} offline={kpReading.isOfflineCache} lang={lang} />}
    </Panel>
  );
};
