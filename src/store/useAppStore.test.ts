import { beforeEach, describe, expect, it } from 'vitest';
import { migratePersistedAppState, PERSIST_VERSION, useAppStore } from './useAppStore';

describe('application navigation stack', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeTab: 'today',
      currentRoute: 'today',
      navigationStack: ['today'],
    });
  });

  it('builds a section-aware stack for deep links', () => {
    useAppStore.getState().navigateToRoute('sky:iss');
    expect(useAppStore.getState()).toMatchObject({
      activeTab: 'sky',
      currentRoute: 'sky:iss',
      navigationStack: ['sky', 'sky:iss'],
    });
  });

  it('returns from a sky tool to the sky overview before leaving the tab', () => {
    useAppStore.getState().navigateToRoute('sky:targets');
    expect(useAppStore.getState().goBack()).toBe(true);
    expect(useAppStore.getState()).toMatchObject({
      activeTab: 'sky',
      currentRoute: 'sky',
      navigationStack: ['sky'],
    });
    expect(useAppStore.getState().goBack()).toBe(false);
  });

  it('resets history when the user chooses another primary tab', () => {
    useAppStore.getState().navigateToRoute('settings:notifications');
    useAppStore.getState().setActiveTab('plan');
    expect(useAppStore.getState()).toMatchObject({ currentRoute: 'plan', navigationStack: ['plan'] });
  });
});

describe('persist migration (F5.1)', () => {
  it('keeps whitelisted, valid fields and drops runtime-only keys', () => {
    const migrated = migratePersistedAppState({
      lang: 'tr',
      nightMode: true,
      fieldMode: false,
      activeTab: 'sky',
      currentLocation: { name: 'Ankara', latitude: 39.9, longitude: 32.9, timezone: 'Europe/Istanbul' },
      locationSource: 'gps',
      currentRoute: 'sky:iss',
      navigationStack: ['sky:iss'],
    });
    expect(migrated).toEqual({
      lang: 'tr',
      nightMode: true,
      // Eski gece modu kaydı scotopic profiline taşınır (TUR 2).
      themeMode: 'scotopic',
      fieldMode: false,
      activeTab: 'sky',
      currentLocation: { name: 'Ankara', latitude: 39.9, longitude: 32.9, timezone: 'Europe/Istanbul' },
      locationSource: 'gps',
    });
  });

  it('drops invalid values so runtime defaults survive', () => {
    expect(migratePersistedAppState({
      lang: 'xx',
      nightMode: 'yes',
      fieldMode: 3,
      activeTab: 'SecretTab',
      locationSource: 'stolen',
      currentLocation: { latitude: 999, longitude: NaN },
    })).toEqual({});
  });

  it('recovers the timezone/name-valid location but rejects impossible coordinates', () => {
    const migrated = migratePersistedAppState({
      currentLocation: { name: 42, latitude: 51.5, longitude: 10, timezone: null },
    });
    expect(migrated.currentLocation).toEqual({ name: '', latitude: 51.5, longitude: 10, timezone: '' });
    expect(migratePersistedAppState({ currentLocation: { latitude: 200, longitude: 0 } }).currentLocation).toBeUndefined();
  });

  it('treats non-object payloads as empty', () => {
    expect(migratePersistedAppState(null)).toEqual({});
    expect(migratePersistedAppState('corrupt')).toEqual({});
    expect(migratePersistedAppState(42)).toEqual({});
  });

  it('stays on version 1', () => {
    expect(PERSIST_VERSION).toBe(1);
  });
});

describe('semantic theme preference (TUR 2)', () => {
  it('persists a valid theme mode and drops unknown values', () => {
    expect(migratePersistedAppState({ themeMode: 'oled' })).toEqual({ themeMode: 'oled' });
    expect(migratePersistedAppState({ themeMode: 'midnight' })).toEqual({});
  });

  it('migrates the legacy night-mode flag to the scotopic profile', () => {
    expect(migratePersistedAppState({ nightMode: true })).toEqual({ nightMode: true, themeMode: 'scotopic' });
    expect(migratePersistedAppState({ nightMode: false })).toEqual({ nightMode: false });
  });

  it('keeps night mode in sync when the theme changes', () => {
    useAppStore.getState().setThemeMode('scotopic');
    expect(useAppStore.getState().themeMode).toBe('scotopic');
    expect(useAppStore.getState().nightMode).toBe(true);

    useAppStore.getState().setThemeMode('daylight');
    expect(useAppStore.getState().themeMode).toBe('daylight');
    expect(useAppStore.getState().nightMode).toBe(false);
  });
});
