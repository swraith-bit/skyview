import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_MODES, isThemeMode, resolveTheme } from './theme';

describe('semantic theme modes', () => {
  it('accepts every supported mode and rejects unknown values', () => {
    THEME_MODES.forEach(mode => expect(isThemeMode(mode)).toBe(true));
    expect(isThemeMode('midnight')).toBe(false);
    expect(isThemeMode(undefined)).toBe(false);
    expect(isThemeMode(3)).toBe(false);
  });

  it('keeps the default theme deep-space', () => {
    expect(DEFAULT_THEME).toBe('deep-space');
  });

  it('forces scotopic while field mode is active', () => {
    expect(resolveTheme('daylight', true)).toBe('scotopic');
    expect(resolveTheme('oled', true)).toBe('scotopic');
  });

  it('returns the user theme outside field mode', () => {
    expect(resolveTheme('daylight', false)).toBe('daylight');
    expect(resolveTheme('oled', false)).toBe('oled');
  });
});
