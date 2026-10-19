import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appStorage } from '../repositories/storageRepository';
import { captureException, getDiagnosticsSnapshot, installStorageDiagnostics, recordDiagnostic } from './diagnostics';

class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
}

describe('privacy-safe diagnostics', () => {
  beforeEach(() => vi.stubGlobal('localStorage', new MemoryStorage()));

  it('redacts coordinates, URLs and keys from diagnostic context', () => {
    recordDiagnostic('error', 'network', 'request-failed', {
      latitude: 41.1,
      longitude: 29.1,
      apiKey: 'secret',
      url: 'https://example.test/private',
      status: 500,
    });
    expect(getDiagnosticsSnapshot()[0]!.details).toEqual({ status: 500 });
  });

  it('stores bounded error metadata without a stack trace', () => {
    captureException(new Error('upstream failed'), 'network', { source: 'Open-Meteo' });
    const entry = getDiagnosticsSnapshot()[0]!;
    expect(entry).toMatchObject({ level: 'error', category: 'network', name: 'Error' });
    expect(entry.details).toMatchObject({ source: 'Open-Meteo', message: 'upstream failed' });
  });

  describe('storageRepository düşüşleri (F5.2)', () => {
    let uninstall: () => void;

    beforeEach(() => { uninstall = installStorageDiagnostics(); });
    afterEach(() => uninstall());

    it('kendi dışı bozuk JSON düşüşünü almanağa yazar', () => {
      appStorage.setString('custom-broken', '{oops');
      expect(appStorage.getJson('custom-broken', { ok: true })).toEqual({ ok: true });

      const entry = getDiagnosticsSnapshot().find(item => item.name === 'storage.json-parse-failed');
      expect(entry).toMatchObject({ level: 'warning', category: 'runtime' });
      expect(entry?.details).toMatchObject({ key: 'custom-broken' });
    });

    it('almanak anahtarının kendindeki düşüşte özyinelemeye girmez', () => {
      appStorage.setString('skyview_diagnostics_v1', '{oops');

      expect(() => appStorage.getJson('skyview_diagnostics_v1', [])).not.toThrow();
      expect(getDiagnosticsSnapshot()).toEqual([]);
    });
  });
});
