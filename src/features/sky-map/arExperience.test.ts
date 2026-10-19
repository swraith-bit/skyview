import { describe, expect, it } from 'vitest';
import { getArQualityProfile } from './arExperience';

describe('AR quality profile', () => {
  it('uses a battery-saving profile on constrained devices', () => {
    expect(getArQualityProfile({ hardwareConcurrency: 4, deviceMemory: 2 }).id).toBe('battery-saver');
  });

  it('uses the balanced profile for ordinary phones', () => {
    expect(getArQualityProfile({ hardwareConcurrency: 6, deviceMemory: 4 }).id).toBe('balanced');
  });

  it('keeps high quality for capable devices', () => {
    expect(getArQualityProfile({ hardwareConcurrency: 8, deviceMemory: 8, devicePixelRatio: 2 }).id).toBe('high');
  });
});
