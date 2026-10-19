import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { LangCode } from '../../i18n';

const labels: Record<LangCode, { offline: string; cached: string; retry: string }> = {
  tr: { offline: 'Çevrimdışısın. Kayıtlı veriler gösteriliyor.', cached: 'Canlı veri alınamadı. Son kayıtlı veriler gösteriliyor.', retry: 'Yeniden dene' },
  en: { offline: 'You are offline. Saved data is being shown.', cached: 'Live data is unavailable. Showing the last saved data.', retry: 'Try again' },
  de: { offline: 'Du bist offline. Gespeicherte Daten werden angezeigt.', cached: 'Live-Daten sind nicht verfügbar. Letzte Daten werden angezeigt.', retry: 'Erneut versuchen' },
  fr: { offline: 'Vous êtes hors ligne. Les données enregistrées sont affichées.', cached: 'Données en direct indisponibles. Dernières données affichées.', retry: 'Réessayer' },
  es: { offline: 'Estás sin conexión. Se muestran los datos guardados.', cached: 'Los datos en directo no están disponibles. Se muestran los últimos datos.', retry: 'Reintentar' },
  ar: { offline: 'أنت غير متصل. يتم عرض البيانات المحفوظة.', cached: 'البيانات المباشرة غير متاحة. يتم عرض آخر بيانات محفوظة.', retry: 'إعادة المحاولة' },
  it: { offline: 'Sei offline. Vengono mostrati i dati salvati.', cached: 'Dati in tempo reale non disponibili. Sono mostrati gli ultimi dati.', retry: 'Riprova' },
  pt: { offline: 'Está offline. São mostrados os dados guardados.', cached: 'Os dados em direto estão indisponíveis. São mostrados os últimos dados.', retry: 'Tentar novamente' },
};

export const OfflineStatusBanner: React.FC<{
  lang: LangCode;
  networkOffline: boolean;
  cachedData: boolean;
  onRetry: () => void;
}> = ({ lang, networkOffline, cachedData, onRetry }) => {
  if (!networkOffline && !cachedData) return null;
  return (
    <div role="status" aria-live="polite" className="sticky top-0 z-40 mb-4 flex min-h-12 items-center gap-2 rounded-lg border border-amber-400/30 bg-[#241b08] px-3 py-2 text-xs text-amber-100 shadow-lg shadow-black/25">
      <CloudOff className="h-4 w-4 shrink-0 text-amber-300" />
      <span className="min-w-0 flex-1">{networkOffline ? labels[lang].offline : labels[lang].cached}</span>
      <button type="button" onClick={onRetry} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-amber-300/30 px-2.5 font-semibold text-amber-100" aria-label={labels[lang].retry}>
        <RefreshCw className="h-3.5 w-3.5" />{labels[lang].retry}
      </button>
    </div>
  );
};
