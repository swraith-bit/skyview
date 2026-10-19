import { LangCode } from '../i18n';

const TARGET_NAMES: Record<string, Record<LangCode, string>> = {
  moon: { tr: 'Ay', en: 'Moon', de: 'Mond', fr: 'Lune', es: 'Luna', ar: 'القمر', it: 'Luna', pt: 'Lua' },
  mercury: { tr: 'Merkür', en: 'Mercury', de: 'Merkur', fr: 'Mercure', es: 'Mercurio', ar: 'عطارد', it: 'Mercurio', pt: 'Mercúrio' },
  venus: { tr: 'Venüs', en: 'Venus', de: 'Venus', fr: 'Vénus', es: 'Venus', ar: 'الزهرة', it: 'Venere', pt: 'Vênus' },
  mars: { tr: 'Mars', en: 'Mars', de: 'Mars', fr: 'Mars', es: 'Marte', ar: 'المريخ', it: 'Marte', pt: 'Marte' },
  jupiter: { tr: 'Jüpiter', en: 'Jupiter', de: 'Jupiter', fr: 'Jupiter', es: 'Júpiter', ar: 'المشتري', it: 'Giove', pt: 'Júpiter' },
  saturn: { tr: 'Satürn', en: 'Saturn', de: 'Saturn', fr: 'Saturne', es: 'Saturno', ar: 'زحل', it: 'Saturno', pt: 'Saturno' },
  uranus: { tr: 'Uranüs', en: 'Uranus', de: 'Uranus', fr: 'Uranus', es: 'Urano', ar: 'أورانوس', it: 'Urano', pt: 'Urano' },
  neptune: { tr: 'Neptün', en: 'Neptune', de: 'Neptun', fr: 'Neptune', es: 'Neptuno', ar: 'نبتون', it: 'Nettuno', pt: 'Netuno' },
};

export const getTargetName = (id: string, lang: LangCode): string =>
  TARGET_NAMES[id]?.[lang] || TARGET_NAMES[id]?.en || id;
