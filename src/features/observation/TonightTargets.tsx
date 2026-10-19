import React, { useMemo, useState } from 'react';
import { Binoculars, Eye, Telescope, Camera, ChevronDown, Heart, Clock3, Compass, Info } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { EquipmentKind, HourlyData, LocationData, TonightTarget } from '../../types';
import { LangCode } from '../../i18n';
import { getTargetName } from '../../utils/targetNames';
import { appStorage } from '../../repositories/storageRepository';
import { CelestialObjectDetail } from './CelestialObjectDetail';
import { useTonightTargets } from '../../hooks/useTonightTargets';
import { useObserverContext } from '../../hooks/useObserverContext';
import { localizeCompassCode } from '../../utils/compassLabels';
import { useAppStore } from '../../store/useAppStore';

const labels = {
  tr: {
    title: 'Bu Gece Görülebilir',
    subtitle: 'Konumuna ve gökyüzü koşullarına göre',
    all: 'Tümü',
    naked: 'Çıplak göz',
    binoculars: 'Dürbün',
    telescope: 'Teleskop',
    camera: 'Kamera',
    best: 'En iyi',
    altitude: 'Yükseklik',
    empty: 'Bu filtre için uygun bir hedef görünmüyor.',
    visibility: {
      excellent: 'Gökyüzünde yüksek konuma ulaşacak.',
      good: 'Ufkun üzerinde gözlenebilir olacak.',
      low: 'Bu gece ufka yakın kalacak.',
    },
  },
  en: {
    title: 'Visible Tonight',
    subtitle: 'Based on your location and sky conditions',
    all: 'All',
    naked: 'Naked eye',
    binoculars: 'Binoculars',
    telescope: 'Telescope',
    camera: 'Camera',
    best: 'Best',
    altitude: 'Altitude',
    empty: 'No suitable target is visible for this filter.',
    visibility: {
      excellent: 'It will reach a high position in the sky.',
      good: 'It will be observable above the horizon.',
      low: 'It will remain close to the horizon tonight.',
    },
  },
  de: {
    title: 'Heute Nacht sichtbar',
    subtitle: 'Basierend auf Standort und Himmelsbedingungen',
    all: 'Alle',
    naked: 'Mit bloßem Auge',
    binoculars: 'Fernglas',
    telescope: 'Teleskop',
    camera: 'Kamera',
    best: 'Beste',
    altitude: 'Höhe',
    empty: 'Für diesen Filter ist kein geeignetes Ziel sichtbar.',
    visibility: {
      excellent: 'Es erreicht eine hohe Position am Himmel.',
      good: 'Es ist über dem Horizont beobachtbar.',
      low: 'Es bleibt heute Nacht nahe am Horizont.',
    },
  },
  fr: {
    title: 'Visible ce soir',
    subtitle: 'Selon votre position et les conditions du ciel',
    all: 'Tout',
    naked: 'Oeil nu',
    binoculars: 'Jumelles',
    telescope: 'Télescope',
    camera: 'Caméra',
    best: 'Meilleur',
    altitude: 'Altitude',
    empty: 'Aucune cible adaptée pour ce filtre.',
    visibility: {
      excellent: 'La cible montera haut dans le ciel.',
      good: 'La cible sera observable au-dessus de l’horizon.',
      low: 'La cible restera proche de l’horizon ce soir.',
    },
  },
  es: {
    title: 'Visible esta noche',
    subtitle: 'Según tu ubicación y condiciones del cielo',
    all: 'Todo',
    naked: 'A simple vista',
    binoculars: 'Binoculares',
    telescope: 'Telescopio',
    camera: 'Cámara',
    best: 'Mejor',
    altitude: 'Altitud',
    empty: 'No hay un objetivo adecuado para este filtro.',
    visibility: {
      excellent: 'Alcanzará una posición alta en el cielo.',
      good: 'Será observable sobre el horizonte.',
      low: 'Permanecerá cerca del horizonte esta noche.',
    },
  },
  ar: {
    title: 'مرئي الليلة',
    subtitle: 'حسب موقعك وظروف السماء',
    all: 'الكل',
    naked: 'بالعين المجردة',
    binoculars: 'منظار',
    telescope: 'تلسكوب',
    camera: 'كاميرا',
    best: 'الأفضل',
    altitude: 'الارتفاع',
    empty: 'لا يوجد هدف مناسب لهذا المرشح.',
    visibility: {
      excellent: 'سيصل إلى موضع عال في السماء.',
      good: 'سيكون قابلا للرصد فوق الأفق.',
      low: 'سيبقى قريبا من الأفق الليلة.',
    },
  },
  it: {
    title: 'Visibile stasera',
    subtitle: 'In base alla posizione e alle condizioni del cielo',
    all: 'Tutti',
    naked: 'A occhio nudo',
    binoculars: 'Binocolo',
    telescope: 'Telescopio',
    camera: 'Fotocamera',
    best: 'Migliore',
    altitude: 'Altitudine',
    empty: 'Nessun obiettivo adatto per questo filtro.',
    visibility: {
      excellent: 'Raggiungerà una posizione alta nel cielo.',
      good: 'Sarà osservabile sopra l’orizzonte.',
      low: 'Resterà vicino all’orizzonte stasera.',
    },
  },
  pt: {
    title: 'Visível esta noite',
    subtitle: 'Com base na sua localização e no céu',
    all: 'Tudo',
    naked: 'A olho nu',
    binoculars: 'Binóculos',
    telescope: 'Telescópio',
    camera: 'Câmera',
    best: 'Melhor',
    altitude: 'Altitude',
    empty: 'Nenhum alvo adequado para este filtro.',
    visibility: {
      excellent: 'Alcançará uma posição alta no céu.',
      good: 'Será observável acima do horizonte.',
      low: 'Ficará perto do horizonte esta noite.',
    },
  },
};

const iconFor = (kind: EquipmentKind) => {
  if (kind === 'binoculars') return Binoculars;
  if (kind === 'telescope') return Telescope;
  if (kind === 'camera') return Camera;
  return Eye;
};

const detailLabels: Record<LangCode, { why: string; equipment: string; favorite: string; calculating: string; viewDetails: string }> = {
  tr: { why: 'Neden önerildi?', equipment: 'Uygun ekipman', favorite: 'Favori hedef', calculating: 'Hedefler hesaplanıyor', viewDetails: 'Tüm ayrıntıları gör' },
  en: { why: 'Why this target?', equipment: 'Suitable equipment', favorite: 'Favorite target', calculating: 'Calculating targets', viewDetails: 'View all details' },
  de: { why: 'Warum dieses Ziel?', equipment: 'Geeignete Ausrüstung', favorite: 'Favorisiertes Ziel', calculating: 'Ziele werden berechnet', viewDetails: 'Alle Details anzeigen' },
  fr: { why: 'Pourquoi cette cible ?', equipment: 'Équipement adapté', favorite: 'Cible favorite', calculating: 'Calcul des cibles', viewDetails: 'Voir tous les détails' },
  es: { why: '¿Por qué este objetivo?', equipment: 'Equipo adecuado', favorite: 'Objetivo favorito', calculating: 'Calculando objetivos', viewDetails: 'Ver todos los detalles' },
  ar: { why: 'لماذا هذا الهدف؟', equipment: 'المعدات المناسبة', favorite: 'هدف مفضل', calculating: 'جارٍ حساب الأهداف', viewDetails: 'عرض جميع التفاصيل' },
  it: { why: 'Perché questo obiettivo?', equipment: 'Attrezzatura adatta', favorite: 'Obiettivo preferito', calculating: 'Calcolo degli obiettivi', viewDetails: 'Visualizza tutti i dettagli' },
  pt: { why: 'Porquê este alvo?', equipment: 'Equipamento adequado', favorite: 'Alvo favorito', calculating: 'Calculando alvos', viewDetails: 'Ver todos os detalhes' },
};

const AltitudeChart: React.FC<{ target: TonightTarget; lang: LangCode; timeZone?: string }> = ({ target, lang, timeZone }) => {
  const points = target.altitudePoints;
  const path = points.map((point, index) => {
    const x = (index / Math.max(1, points.length - 1)) * 280;
    const y = 96 - Math.max(0, Math.min(90, point.altitude)) / 90 * 82;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <svg viewBox="0 0 280 108" className="w-full h-28" role="img" aria-label={`${target.id} altitude curve`}>
        {[0, 30, 60, 90].map(value => {
          const y = 96 - value / 90 * 82;
          return <line key={value} x1="0" x2="280" y1={y} y2={y} stroke="rgba(148,163,184,.12)" />;
        })}
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{points[0]?.time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone })}</span>
        <span>{labels[lang]?.altitude || labels.en.altitude}</span>
        <span>{points.at(-1)?.time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone })}</span>
      </div>
    </div>
  );
};

export const TonightTargets: React.FC<{
  location: LocationData;
  cloudCover: number;
  hourly?: HourlyData | null;
  lang: LangCode;
  limit?: number;
  /** TUR 2: Global zaman ekseni açıkken hedefler seçilen saate göre hesaplanır. */
  instantOverride?: Date;
}> = ({ location, cloudCover, hourly, lang, limit, instantOverride }) => {
  const text = labels[lang] || labels.en;
  const navigateToRoute = useAppStore(state => state.navigateToRoute);
  const baseObserver = useObserverContext(location);
  const observer = useMemo(
    () => instantOverride ? { ...baseObserver, instant: instantOverride } : baseObserver,
    [baseObserver, instantOverride],
  );
  const [filter, setFilter] = useState<EquipmentKind | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<TonightTarget | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => appStorage.getJson('skyview_favorite_targets', []));
  const { targets, loading: targetsLoading } = useTonightTargets(
    observer,
    hourly || cloudCover,
  );
  const filtered = targets
    .filter(target => filter === 'all' || target.equipment.includes(filter))
    .slice(0, limit);
  const filters: Array<{ id: EquipmentKind | 'all'; label: string }> = [
    { id: 'all', label: text.all },
    { id: 'naked-eye', label: text.naked },
    { id: 'binoculars', label: text.binoculars },
    { id: 'telescope', label: text.telescope },
    { id: 'camera', label: text.camera },
  ];
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    setFavorites(next);
    appStorage.setJson('skyview_favorite_targets', next);
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{text.title}</h2>
        <p className="text-sm text-slate-400">{text.subtitle}</p>
      </div>
      {!limit && (
        <div className="grid grid-cols-2 sm:flex gap-2" role="tablist">
          {filters.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`min-w-0 min-h-12 px-3 rounded-lg border text-sm font-medium text-center leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${
                filter === item.id
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900/50 border-white/10 text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {targetsLoading && (
          <div className="space-y-3" aria-label={detailLabels[lang]?.calculating ?? detailLabels.en.calculating}>
            {[0, 1, 2].map(item => <div key={item} className="h-20 animate-pulse rounded-lg border border-white/5 bg-slate-900/45" />)}
          </div>
        )}
        {/* F4.2: while loading, keep the previous location's cards off-render so the
            skeleton stands alone instead of stacking the stale list beneath it. */}
        {!targetsLoading && filtered.map((target, index) => {
          const primaryEquipment = filter === 'all' ? target.equipment[0] : filter;
          if (!primaryEquipment) return null; // noUncheckedIndexedAccess: equipment dizisi her zaman dolu
          const PrimaryIcon = iconFor(primaryEquipment);
          const isExpanded = expanded === target.id;
          return (
            <article key={target.id} className="rounded-lg border border-white/10 bg-slate-900/45 p-4">
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : target.id)}
                className="w-full min-h-12 flex items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 rounded-md"
                aria-expanded={isExpanded}
              >
                <div className="w-11 h-11 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                  <PrimaryIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <h3 className="min-w-0 font-semibold text-white break-words">{getTargetName(target.id, lang)}</h3>
                    {index === 0 && <span className="shrink-0 text-xs text-emerald-400">{text.best}</span>}
                  </div>
                  <p className="text-sm text-slate-400">
                    {target.bestTime.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}
                    {' · '}{Math.round(target.altitude)}° · {localizeCompassCode(target.direction, lang)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-sky-400">{target.score}</span>
                <ChevronDown className={`w-5 h-5 shrink-0 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && (
                <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-indigo-300">{detailLabels[lang].why}</p>
                      <p className="mt-1 text-sm text-slate-300">{text.visibility[target.visibility]} {Math.round(target.altitude)}° · {target.score}/100</p>
                    </div>
                    <button type="button" onClick={() => toggleFavorite(target.id)} aria-label={detailLabels[lang].favorite} className="min-h-11 min-w-11 rounded-lg border border-white/10 flex items-center justify-center text-rose-300">
                      <Heart className={`w-5 h-5 ${favorites.includes(target.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">{detailLabels[lang].equipment}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {target.equipment.map(kind => {
                        const EquipmentIcon = iconFor(kind);
                        const equipmentLabel = filters.find(item => item.id === kind)?.label || kind;
                        return <span key={kind} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/70 px-2.5 py-2 text-xs text-slate-200"><EquipmentIcon className="w-3.5 h-3.5" />{equipmentLabel}</span>;
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><Clock3 className="w-4 h-4 text-sky-400" />{target.bestTime.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}</span>
                    <span className="flex items-center gap-1.5"><Compass className="w-4 h-4 text-indigo-400" />{localizeCompassCode(target.direction, lang)}</span>
                  </div>
                   <AltitudeChart target={target} lang={lang} timeZone={location.timezone} />
                   <button type="button" onClick={() => setDetailTarget(target)} className="min-h-11 w-full rounded-lg border border-indigo-400/30 bg-indigo-500/10 text-sm font-semibold text-indigo-200 flex items-center justify-center gap-2"><Info className="h-4 w-4" />{detailLabels[lang]?.viewDetails ?? detailLabels.en.viewDetails}</button>
                </div>
              )}
            </article>
          );
        })}
        {!targetsLoading && filtered.length === 0 && (
          <EmptyState icon={Telescope} message={text.empty} />
        )}
      </div>
      {detailTarget && <CelestialObjectDetail target={detailTarget} location={location} lang={lang} onClose={() => setDetailTarget(null)} onOpenAr={() => navigateToRoute('sky:ar')} />}
    </section>
  );
};
