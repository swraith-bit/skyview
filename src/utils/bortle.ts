import { LangCode, t } from '../i18n';

export interface BortleInfo {
  classValue: number;
  rating: string;
  desc: string;
  advice: string;
  color: string;
}

const clampBortleClass = (value: number): number => {
  if (!Number.isFinite(value)) return 5;
  return Math.min(9, Math.max(1, Math.round(value)));
};

const bortleColors: Record<number, string> = {
  1: 'text-emerald-400',
  2: 'text-emerald-400',
  3: 'text-teal-400',
  4: 'text-teal-400',
  5: 'text-amber-400',
  6: 'text-amber-500',
  7: 'text-rose-400',
  8: 'text-rose-500',
  9: 'text-rose-600',
};

export const getBortleInfo = (bortleValue: number, lang: LangCode): BortleInfo => {
  const classValue = clampBortleClass(bortleValue);
  return {
    classValue,
    rating: t(`lpm.b${classValue}r`, lang),
    desc: t(`lpm.b${classValue}d`, lang),
    advice: t(`lpm.b${classValue}a`, lang),
    color: bortleColors[classValue] || 'text-amber-400',
  };
};
