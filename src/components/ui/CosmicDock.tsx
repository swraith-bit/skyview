import React, { ReactNode } from 'react';

export interface CosmicDockItem {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  /** Merkezde yükselen AR eylemi. */
  emphasis?: boolean;
  onSelect: () => void;
}

/**
 * TUR 2 — Yüzen Kozmik Dock.
 *
 * Statik alt bar yerine kenarlardan nefes alan tek parça cam yüzey; merkezde
 * AR vizörü başparmağın doğal konumunda, tek dokunuşla erişilir.
 */
export const CosmicDock: React.FC<{
  items: CosmicDockItem[];
  ariaLabel: string;
}> = ({ items, ariaLabel }) => (
  <nav
    aria-label={ariaLabel}
    className="md:hidden fixed dock-safe inset-x-3 z-50 rounded-[26px] border border-white/10 bg-app-nav/95 px-2 pb-2 pt-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl"
  >
    <div className="grid grid-cols-5 items-end">
      {items.map(item => item.emphasis ? (
        <button
          key={item.id}
          type="button"
          onClick={item.onSelect}
          aria-label={item.label}
          aria-current={item.active ? 'page' : undefined}
          className="group -mt-7 flex min-h-16 flex-col items-center justify-end gap-1 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-2xl"
        >
          <span className={`dock-core relative flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform duration-200 ${item.active ? 'scale-105' : 'group-active:scale-95'}`}>
            {item.active && <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/25" aria-hidden="true" />}
            <span className="relative">{item.icon}</span>
          </span>
          <span className="text-2xs font-semibold tracking-wide text-slate-200">{item.label}</span>
        </button>
      ) : (
        <button
          key={item.id}
          type="button"
          onClick={item.onSelect}
          aria-label={item.label}
          aria-current={item.active ? 'page' : undefined}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <span className={`flex h-8 w-11 items-center justify-center rounded-full transition-colors duration-300 ${item.active ? 'dock-pill text-sky-200' : 'text-slate-400'}`}>
            {item.icon}
          </span>
          <span className={`text-2xs font-semibold tracking-wide ${item.active ? 'text-sky-200' : 'text-slate-400'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  </nav>
);
