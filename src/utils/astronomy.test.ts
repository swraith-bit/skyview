import { describe, expect, it } from 'vitest';
import { Body, Equator, Horizon, Observer } from 'astronomy-engine';
import { getEveningSunTimes, getMoonPhase, getMoonPhaseForLocalDate, getTonightTargets, getVisiblePlanets } from './astronomy';
import { getDateKeyInTimeZone } from './dateTime';

describe('getVisiblePlanets', () => {
  it('does not report planets during daylight', () => {
    const istanbulNoon = new Date('2026-06-15T09:00:00Z');

    expect(getVisiblePlanets(istanbulNoon, 41.0082, 28.9784)).toEqual([]);
  });

  it('selects target times from astronomical night rather than daytime', () => {
    const istanbulNoon = new Date('2026-06-15T09:00:00Z');
    const targets = getTonightTargets(istanbulNoon, 41.0082, 28.9784, 10);

    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(target => {
      const hourUtc = target.bestTime.getUTCHours();
      return hourUtc >= 18 || hourUtc <= 2;
    })).toBe(true);
  });

  it('bounds late-night target calculations to the current night without spilling into the next evening', () => {
    // 2026-06-15T20:00:00Z is 23:00 in Istanbul (already inside astronomical night).
    // Current night ends around 2026-06-16T02:00:00Z; the next night starts after 2026-06-16T18:00:00Z.
    const istanbulLateNight = new Date('2026-06-15T20:00:00Z');
    const targets = getTonightTargets(istanbulLateNight, 41.0082, 28.9784, 10);
    const nextMorningCutoffMs = new Date('2026-06-16T06:00:00Z').getTime();

    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(target => target.bestTime.getTime() < nextMorningCutoffMs)).toBe(true);
  });

  it('assigns meaningfully different targets to equipment filters', () => {
    const targets = getTonightTargets(new Date('2026-06-15T18:00:00Z'), 41.0082, 28.9784, 10);
    const nakedEye = targets.filter(target => target.equipment.includes('naked-eye')).map(target => target.id);
    const telescope = targets.filter(target => target.equipment.includes('telescope')).map(target => target.id);

    expect(nakedEye).not.toEqual(telescope);
  });

  it('only marks planets as naked-eye targets when they are practically observable', () => {
    const targets = getTonightTargets(new Date('2026-06-15T09:00:00Z'), 41.0082, 28.9784, 10);
    const nakedEyePlanets = targets.filter(target =>
      target.id !== 'moon' && target.equipment.includes('naked-eye'));

    expect(nakedEyePlanets.every(target => target.altitude >= 10)).toBe(true);
    expect(nakedEyePlanets.some(target => target.id === 'uranus' || target.id === 'neptune')).toBe(false);
  });

  it('uses hourly cloud forecasts when scoring targets', () => {
    const date = new Date('2026-06-15T18:00:00Z');
    const clear = getTonightTargets(date, 41.0082, 28.9784, {
      time: Array.from({ length: 36 }, (_, index) => (date.getTime() + index * 3600000) / 1000),
      cloudCover: Array(36).fill(0),
      windspeed: Array(36).fill(5),
    });
    const cloudy = getTonightTargets(date, 41.0082, 28.9784, {
      time: Array.from({ length: 36 }, (_, index) => (date.getTime() + index * 3600000) / 1000),
      cloudCover: Array(36).fill(100),
      windspeed: Array(36).fill(5),
    });

    expect(clear[0]?.score).toBeGreaterThan(cloudy[0]!.score);
  });

  it('computes moon phase from the selected location date, not the device UTC date', () => {
    const instantNearDateBoundary = new Date('2026-06-15T22:30:00Z');
    const tokyoPhase = getMoonPhaseForLocalDate(instantNearDateBoundary, 'en', 'Asia/Tokyo');
    const newYorkPhase = getMoonPhaseForLocalDate(instantNearDateBoundary, 'en', 'America/New_York');

    expect(tokyoPhase.date.toISOString()).toBe('2026-06-16T12:00:00.000Z');
    expect(newYorkPhase.date.toISOString()).toBe('2026-06-16T01:00:00.000Z');
  });

  it('resolves the moon phase name through the language path (F5.6)', () => {
    const sample = new Date('2026-06-15T20:00:00Z');
    const enPhase = getMoonPhase(sample, 'en');

    // katalog yolundan çözülen etiket — anahtar metni sızmadan
    expect(enPhase.phaseName).not.toMatch(/^moon\./);
    expect([
      'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
      'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
    ]).toContain(enPhase.phaseName);

    // lang verilmeyen çağrılar yerleşik Türkçe yedeğini kullanır (davranış korunur)
    const barePhase = getMoonPhase(sample);
    expect(barePhase.phaseName).not.toMatch(/^moon\./);
    expect(getMoonPhase(sample, 'tr').phaseName).not.toBe('moon.phases.new-moon');
  });
});

describe('getEveningSunTimes', () => {
  const sunAltitudeAt = (date: Date | null, lat: number, lon: number): number => {
    if (!date) throw new Error('expected a sun event');
    const observer = new Observer(lat, lon, 0);
    const equator = Equator(Body.Sun, date, observer, true, true);
    return Horizon(date, observer, equator.ra, equator.dec).altitude;
  };

  it('returns evening events in order at their target solar altitudes', () => {
    const times = getEveningSunTimes(new Date('2026-10-16T09:00:00Z'), 41.0082, 28.9784, 'Europe/Istanbul');
    const sequence = [
      times.goldenHour, times.sunsetStart, times.sunset, times.dusk, times.nauticalDusk, times.night,
    ].map(time => time?.getTime() ?? Number.NaN);

    expect(sequence.every(Number.isFinite)).toBe(true);
    expect(sequence).toEqual([...sequence].sort((a, b) => a - b));
    expect(sunAltitudeAt(times.goldenHour, 41.0082, 28.9784)).toBeCloseTo(6, 1);
    expect(sunAltitudeAt(times.dusk, 41.0082, 28.9784)).toBeCloseTo(-6, 1);
    expect(sunAltitudeAt(times.nauticalDusk, 41.0082, 28.9784)).toBeCloseTo(-12, 1);
    expect(sunAltitudeAt(times.night, 41.0082, 28.9784)).toBeCloseTo(-18, 1);
  });

  it('keeps twilight that ends after local midnight on the same evening', () => {
    // Near midsummer in A Coruña, astronomical night starts around 00:40 CEST.
    const times = getEveningSunTimes(new Date('2026-06-21T10:00:00Z'), 43.37, -8.4, 'Europe/Madrid');

    expect(times.night && getDateKeyInTimeZone(times.night, 'Europe/Madrid')).toBe('2026-06-22');
    expect(times.night?.getTime()).toBeGreaterThan(times.nauticalDusk?.getTime() ?? Infinity);
  });

  it('returns null instead of inventing times when the Sun never sets', () => {
    const times = getEveningSunTimes(new Date('2026-06-21T10:00:00Z'), 69.6492, 18.9553, 'Europe/Oslo');

    expect(times.sunset).toBeNull();
    expect(times.night).toBeNull();
  });
});
