import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelIssNotifications,
  cancelMeteorNotifications,
  getIssAlarmId,
  getMeteorAlarmId,
} from './scheduledAlertCleanup';

const notificationMocks = vi.hoisted(() => ({
  cancelNotification: vi.fn(async () => true),
}));

vi.mock('./notifications', () => notificationMocks);

const richMocks = vi.hoisted(() => ({
  cancelRichEvent: vi.fn(async () => undefined),
}));

vi.mock('../native/richNotifications', () => richMocks);

class MemoryStorage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

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

describe('scheduled alert cleanup', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    notificationMocks.cancelNotification.mockClear();
    richMocks.cancelRichEvent.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cancels and clears scheduled meteor alerts', async () => {
    storage.setItem('meteor_alarm_Perseids', '1');

    await cancelMeteorNotifications();

    expect(storage.getItem('meteor_alarm_Perseids')).toBeNull();
    expect(notificationMocks.cancelNotification).toHaveBeenCalledWith(getMeteorAlarmId('Perseids'));
    expect(richMocks.cancelRichEvent).toHaveBeenCalledWith(getMeteorAlarmId('Perseids'));
  });

  it('cancels and clears scheduled ISS alerts', async () => {
    const riseTime = '2026-08-12T20:00:00.000Z';
    storage.setItem(`iss_alarm_${riseTime}`, '1');
    storage.setItem('iss_alarm_time', riseTime);

    await cancelIssNotifications();

    expect(storage.getItem(`iss_alarm_${riseTime}`)).toBeNull();
    expect(storage.getItem('iss_alarm_time')).toBeNull();
    expect(notificationMocks.cancelNotification).toHaveBeenCalledWith(getIssAlarmId(riseTime));
    expect(richMocks.cancelRichEvent).toHaveBeenCalledWith(getIssAlarmId(riseTime));
  });
});
