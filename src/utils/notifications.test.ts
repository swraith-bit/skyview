import { beforeEach, describe, expect, it, vi } from 'vitest';
import { moveOutsideQuietHours, scheduleNotification } from './notifications';

const mockPrefs = vi.hoisted(() => ({
  quietHoursEnabled: false,
  quietStart: '23:00',
  quietEnd: '07:00',
}));

vi.mock('./featureStorage', () => ({
  getNotificationPreferences: () => mockPrefs,
}));

const notificationPlugin = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  checkExactNotificationSetting: vi.fn(),
  changeExactNotificationSetting: vi.fn(),
  cancel: vi.fn(),
  schedule: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'android',
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: notificationPlugin,
}));

describe('notification scheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrefs.quietHoursEnabled = false;
    mockPrefs.quietStart = '23:00';
    mockPrefs.quietEnd = '07:00';
    notificationPlugin.checkPermissions.mockResolvedValue({ display: 'granted' });
    notificationPlugin.cancel.mockResolvedValue(undefined);
    notificationPlugin.schedule.mockResolvedValue(undefined);
  });

  it('falls back to an inexact Android notification when exact alarm access remains denied', async () => {
    notificationPlugin.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'denied' });
    notificationPlugin.changeExactNotificationSetting.mockResolvedValue(undefined);

    const result = await scheduleNotification(42, 'ISS', 'Upcoming pass', new Date(Date.now() + 60_000), true);

    expect(result).toBe('inexact');
    expect(notificationPlugin.schedule).toHaveBeenCalledWith({
      notifications: [expect.objectContaining({ schedule: expect.objectContaining({ allowWhileIdle: false }) })],
    });
  });

  it('keeps exact scheduling when Android grants exact alarm access', async () => {
    notificationPlugin.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'granted' });

    const result = await scheduleNotification(43, 'ISS', 'Upcoming pass', new Date(Date.now() + 60_000), true);

    expect(result).toBe('exact');
    expect(notificationPlugin.schedule).toHaveBeenCalledWith({
      notifications: [expect.objectContaining({ schedule: expect.objectContaining({ allowWhileIdle: true }) })],
    });
  });

  it('shifts quiet-hour notifications using the observer location IANA timezone', () => {
    mockPrefs.quietHoursEnabled = true;
    mockPrefs.quietStart = '23:00';
    mockPrefs.quietEnd = '07:00';

    // 2026-06-15T15:30:00Z is 00:30 on June 16 in Asia/Tokyo (inside quiet hours 23:00-07:00),
    // but 11:30 on June 15 in America/New_York (outside quiet hours).
    const instant = new Date('2026-06-15T15:30:00.000Z');

    const shiftedTokyo = moveOutsideQuietHours(instant, 'Asia/Tokyo');
    // 07:00 on June 16 in Asia/Tokyo (UTC+9) is 2026-06-15T22:00:00.000Z
    expect(shiftedTokyo.toISOString()).toBe('2026-06-15T22:00:00.000Z');

    const unshiftedNewYork = moveOutsideQuietHours(instant, 'America/New_York');
    expect(unshiftedNewYork.toISOString()).toBe(instant.toISOString());
  });

  it('flags scheduling whose trigger moved into quiet-hours-end as quiet (F4.4)', async () => {
    mockPrefs.quietHoursEnabled = true;
    mockPrefs.quietStart = '00:00';
    mockPrefs.quietEnd = '08:00';

    const result = await scheduleNotification(
      44,
      'Meteor',
      'Peak tonight',
      new Date('2027-01-15T03:00:00.000Z'), // 03:00 UTC is inside 00:00–08:00 quiet
      false,
      undefined,
      'UTC',
    );

    expect(result).toBe('quiet');
    const scheduleCall = notificationPlugin.schedule.mock.calls[0]?.[0];
    // Moved to the 08:00 UTC end-of-quiet boundary on the same day.
    expect(scheduleCall.notifications[0].schedule.at.toISOString()).toBe('2027-01-15T08:00:00.000Z');
  });
});
