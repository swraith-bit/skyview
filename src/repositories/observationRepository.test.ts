import { beforeEach, describe, expect, it, vi } from 'vitest';

const values = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
  removeItem: vi.fn((key: string) => { values.delete(key); }),
  key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
  get length() { return values.size; },
  clear: vi.fn(() => values.clear()),
};

vi.stubGlobal('localStorage', localStorageMock);

const location = { name: 'Test', latitude: 40, longitude: 29, timezone: 'Europe/Istanbul' };

describe('observationRepository', () => {
  beforeEach(() => values.clear());

  it('stores, completes and removes a planned target', async () => {
    const { observationRepository } = await import('./observationRepository');
    const item = observationRepository.addPlan({ targetId: 'saturn', targetName: 'Saturn', plannedFor: '2026-07-13T22:00:00.000Z', location });
    expect(observationRepository.listPlan()).toHaveLength(1);
    observationRepository.togglePlan(item.id);
    expect(observationRepository.listPlan()[0]!.completed).toBe(true);
    observationRepository.removePlan(item.id);
    expect(observationRepository.listPlan()).toEqual([]);
  });

  it('keeps a bounded observation journal', async () => {
    const { observationRepository } = await import('./observationRepository');
    observationRepository.addLog({ targetId: 'moon', targetName: 'Moon', observedAt: '2026-07-13T22:00:00.000Z', location, note: 'Clear', rating: 5 });
    expect(observationRepository.listLogs()[0]).toMatchObject({ targetId: 'moon', note: 'Clear', rating: 5 });
  });
});
