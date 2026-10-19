import React from 'react';

export interface SectionTab<T extends string> {
  id: T;
  label: string;
  icon: React.ReactNode;
}

export function SectionTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<SectionTab<T>>;
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 touch-auto scrollbar-thin" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`min-h-12 shrink-0 px-3 rounded-lg border flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-center leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${
            active === tab.id
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-900/50 border-white/10 text-slate-300'
          }`}
        >
          <span className="shrink-0">{tab.icon}</span>
          <span className="whitespace-nowrap">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
