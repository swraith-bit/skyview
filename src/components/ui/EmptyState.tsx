import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * F6.6 — Standart boş-durum gösterimi:
 *
 *  - Metin paylaşan her boş liste/panel aynı kapla gösterilir; her ekranın kendi
 *    yazdığı px/py/padding/renk kombinasyonu yerine tek görsel dil.
 *  - Mesaj çağıran taraftan gelir: mevcut i18n anahtarları (plan.empty,
 *    journal.empty) ve dosya-içi 8-dil haritaları (TonightTargets,
 *    SatelliteTracker) aynen kullanılır — sıfır yeni anahtar (parite kuralı).
 *  - `compact` liste-içi dar varyanttır (ObservationWorkspace); varsayılan
 *    panel-içi ferah varyanttır (TonightTargets/SatelliteTracker).
 *  - `icon` verildiğinde dekoratiftir (aria-hidden); boş durum sade metin olarak
 *    da erişilebilir kalır.
 */
export const EmptyState: React.FC<{
  icon?: LucideIcon;
  message: string;
  compact?: boolean;
  className?: string;
}> = ({ icon: Icon, message, compact = false, className }) => (
  <div
    className={`rounded-lg border border-white/10 text-center text-slate-400 ${compact ? 'px-3 py-3' : 'px-4 py-6'} ${className ?? ''}`}
  >
    {Icon && <Icon aria-hidden="true" className="mx-auto mb-1.5 h-5 w-5 text-slate-500" />}
    <p className="text-sm leading-snug">{message}</p>
  </div>
);
