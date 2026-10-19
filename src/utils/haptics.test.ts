import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lockHaptic, selectionHaptic, successHaptic, warningHaptic } from './haptics';

const { nativeFlag, hapticsMock } = vi.hoisted(() => ({
  nativeFlag: { value: true },
  hapticsMock: {
    selectionChanged: vi.fn(),
    impact: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => nativeFlag.value },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: hapticsMock,
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
}));

describe('haptics söz varlığı (F6.8)', () => {
  beforeEach(() => {
    hapticsMock.selectionChanged.mockReset();
    hapticsMock.impact.mockReset();
    nativeFlag.value = true;
  });

  afterEach(() => {
    nativeFlag.value = false;
  });

  it('seçim tiki selectionChanged yollar', async () => {
    await selectionHaptic();
    expect(hapticsMock.selectionChanged).toHaveBeenCalledTimes(1);
    expect(hapticsMock.impact).not.toHaveBeenCalled();
  });

  it('başarı Light, yıkıcı eylem Medium ile sözlüğe sadık kalır', async () => {
    await successHaptic();
    expect(hapticsMock.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
    await warningHaptic();
    expect(hapticsMock.impact).toHaveBeenCalledWith({ style: 'MEDIUM' });
  });

  it('AR hedef kilidi iki ayrı darbe üretir (F6.1)', async () => {
    await lockHaptic();
    expect(hapticsMock.impact).toHaveBeenNthCalledWith(1, { style: 'LIGHT' });
    expect(hapticsMock.impact).toHaveBeenNthCalledWith(2, { style: 'MEDIUM' });
  });

  it('native olmayan platformda tamamen sessiz çıkar', async () => {
    nativeFlag.value = false;
    await selectionHaptic();
    await successHaptic();
    await warningHaptic();
    await lockHaptic();
    expect(hapticsMock.selectionChanged).not.toHaveBeenCalled();
    expect(hapticsMock.impact).not.toHaveBeenCalled();
  });

  it('kapasitör reddini yutar; dokunsal geri bildirim akışı bozmaz', async () => {
    hapticsMock.impact.mockRejectedValueOnce(new Error('no sensor'));
    await expect(successHaptic()).resolves.toBeUndefined();
    expect(hapticsMock.impact).toHaveBeenCalledTimes(1);
  });
});
