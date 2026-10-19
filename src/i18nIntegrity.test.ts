import { describe, expect, it } from 'vitest';
import { loadAllTranslations, LangCode } from './i18n';
import { extraTranslations } from './i18nExtra';
import { productMessageCatalog } from './i18nProduct';
import { canonicalCompassCode, COMPASS_CODES, compassIndexForAzimuth } from './utils/compass';
import { getCompassDirection, getCompassLabels, localizeCompassCode } from './utils/compassLabels';

const languages: LangCode[] = ['en', 'tr', 'de', 'fr', 'es', 'ar', 'it', 'pt'];
const flatten = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(flatten);
};

// F5.6: ana katalog için anahtar-yolu düzleştirme (parite denetimi değerlerle değil
// anahtar kümesiyle karşılaştırmalı; metinler dil başına elbette farklıdır).
const flattenKeys = (node: unknown, prefix = ''): string[] => {
  if (typeof node === 'string') return [prefix];
  if (!node || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([key, child]) => (
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  ));
};

describe('translation catalogs', () => {
  it('keeps every product key available in every language', () => {
    const keys = Object.keys(productMessageCatalog.en).sort();
    languages.forEach(lang => expect(Object.keys(productMessageCatalog[lang]).sort()).toEqual(keys));
  });

  it('keeps the main catalog key set identical in every language (F5.6)', async () => {
    const translations = await loadAllTranslations();
    const enKeys = flattenKeys(translations.en).sort();
    expect(enKeys.length).toBeGreaterThan(200);
    languages.forEach(lang => {
      expect(flattenKeys(translations[lang]).sort()).toEqual(enKeys);
    });
  });

  it('keeps the i18nExtra flat layer identical and non-empty in every language (F5.6)', () => {
    const enKeys = Object.keys(extraTranslations.en).sort();
    expect(enKeys.length).toBeGreaterThan(40);
    languages.forEach(lang => {
      const messages = extraTranslations[lang];
      expect(Object.keys(messages).sort()).toEqual(enKeys);
      Object.values(messages).forEach(value => expect(value.length).toBeGreaterThan(0));
    });
    // F5.6: pusula kısaltmaları — her dilde 8 kanonik kod çaprazında ayrık kısa etiket
    Object.values(extraTranslations).forEach(messages => {
      ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].forEach(code => {
        expect(messages[`compass.${code}`]).toBeTruthy();
      });
    });
  });

  it('resolves localized compass labels per language and indexes azimuth halves correctly', () => {
    languages.forEach(lang => {
      const labels = getCompassLabels(lang);
      expect(labels).toHaveLength(8);
      expect(new Set(labels).size).toBe(8);
      COMPASS_CODES.forEach(code => expect(localizeCompassCode(code, lang)).toBeTruthy());
    });
    expect(getCompassDirection(0, 'tr')).toBe('K');
    expect(getCompassDirection(90, 'de')).toBe('O');
    expect(getCompassDirection(140, 'ar')).toBe(getCompassLabels('ar')[3]);
    expect(getCompassDirection(361, 'en')).toBe('N');
    expect(getCompassDirection(-90, 'pt')).toBe('O');
    // bilinmeyen kod elinde-öylece döner (t() anahtar-sızıntısı yok)
    expect(localizeCompassCode('SSE', 'tr')).toBe('SSE');
    expect(compassIndexForAzimuth(370)).toBe(0);
    expect(canonicalCompassCode(-45.1)).toBe('NW');
  });

  it('does not contain replacement characters or common UTF-8 mojibake pairs', async () => {
    const translations = await loadAllTranslations();
    const badEncoding = /(?:Ã[\u0080-\u00bf]|Â[\u0080-\u00bf]|â[\u0080-\u00bf]|Ø[\u0080-\u00bf]|Ù[\u0080-\u00bf]|\uFFFD)/;
    languages.forEach(lang => {
      const messages = [...flatten(translations[lang]), ...flatten(extraTranslations[lang]), ...flatten(productMessageCatalog[lang])];
      expect(messages.filter(message => badEncoding.test(message))).toEqual([]);
    });
  });
});
