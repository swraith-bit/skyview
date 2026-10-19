import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultNotificationPreferences,
  getNotificationPreferences,
  readStorageJson,
  writeStorageJson,
} from './featureStorage';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('feature storage helpers', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips JSON values', () => {
    expect(writeStorageJson('prefs', { cloudThreshold: 30 })).toBe(true);
    expect(readStorageJson('prefs', { cloudThreshold: 80 })).toEqual({ cloudThreshold: 30 });
  });

  it('returns fallback and removes corrupt JSON', () => {
    storage.setItem('broken', '{not-json');

    expect(readStorageJson('broken', { ok: true })).toEqual({ ok: true });
    expect(storage.getItem('broken')).toBeNull();
  });

  it('validates notification preferences field-wise and falls back on out-of-range fields', () => {
    storage.setItem('skyview_smart_notifications', JSON.stringify({
      issAlerts: false,
      cloudThreshold: 250,
      quietStart: '99:99',
      quietEnd: '06:30',
      eventLeadHours: 'invalid',
    }));

    const prefs = getNotificationPreferences();
    expect(prefs.issAlerts).toBe(false);
    expect(prefs.quietEnd).toBe('06:30');
    expect(prefs.cloudThreshold).toBe(defaultNotificationPreferences.cloudThreshold);
    expect(prefs.quietStart).toBe(defaultNotificationPreferences.quietStart);
    expect(prefs.eventLeadHours).toBe(defaultNotificationPreferences.eventLeadHours);
  });
});
