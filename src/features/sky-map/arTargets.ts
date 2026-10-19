import { Body } from 'astronomy-engine';
import { LangCode, t } from '../../i18n';
import { Constellation, DSO, Star } from '../../data/celestialData';
import { arInlineTranslations } from '../../data/celestialDescriptions';

export type CelestialTarget =
  | { type: 'star'; data: Star & { az: number; alt: number } }
  | { type: 'planet'; data: { id: string; name: string; az: number; alt: number; dist: number; mag: number } }
  | { type: 'constellation'; data: Constellation & { centerAz: number; centerAlt: number } }
  | { type: 'dso'; data: DSO & { az: number; alt: number } };

export interface RenderedBody { id: Body; key: string; color: string; size: number; }
export interface ProjectedBody { x: number; y: number; body: RenderedBody; az: number; alt: number; key: string; dist: number; mag: number; }

export const getArTranslation = (key: string, lang: LangCode): string => {
  const inline = arInlineTranslations[key]?.[lang];
  if (inline) return inline;
  const translated = t(`arMap.${key}`, lang);
  return translated !== `arMap.${key}` ? translated : key;
};
export const getTargetId = (target: CelestialTarget | null): string | null => target?.data.id ?? null;
export const getTargetDisplayType = (target: CelestialTarget, lang: LangCode): string => {
  if (target.type === 'star') return getArTranslation('star', lang);
  if (target.type === 'dso') return `${getArTranslation('dsos', lang)} (${target.data.messier})`;
  if (target.type === 'constellation') return getArTranslation('constellations', lang);
  return getArTranslation('planet', lang);
};
export const getTargetDisplayName = (target: CelestialTarget, lang: LangCode): string => target.type === 'planet'
  ? target.data.name
  : target.data.names[lang] || target.data.names.en || target.data.id;
export const getTargetAz = (target: CelestialTarget): number => target.type === 'constellation' ? target.data.centerAz : target.data.az;
export const getTargetAlt = (target: CelestialTarget): number => target.type === 'constellation' ? target.data.centerAlt : target.data.alt;
export const getTargetMagnitude = (target: CelestialTarget): string => target.type === 'star' || target.type === 'planet' ? target.data.mag.toFixed(1) : '--';
export const getTargetDistance = (target: CelestialTarget, lang: LangCode = 'en'): string => {
  if (target.type === 'star') return '∞';
  if (target.type === 'dso') return getArTranslation('dsos', lang);
  if (target.type === 'constellation') return '--';
  return `${target.data.dist.toFixed(4)} AU`;
};
