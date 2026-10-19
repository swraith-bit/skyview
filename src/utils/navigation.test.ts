import { describe, expect, it } from 'vitest';
import { parseAppRouteUrl, tabForRoute } from './navigation';

describe('app navigation', () => {
  it('maps notification routes to primary tabs', () => {
    expect(tabForRoute('sky:iss')).toBe('sky');
    expect(tabForRoute('plan:meteor')).toBe('plan');
    expect(tabForRoute('settings:notifications')).toBe('settings');
  });

  it('parses supported app links and rejects unknown routes', () => {
    expect(parseAppRouteUrl('skyview://sky/iss')).toBe('sky:iss');
    expect(parseAppRouteUrl('skyview://plan/meteor')).toBe('plan:meteor');
    expect(parseAppRouteUrl('skyview://unknown/path')).toBeNull();
    expect(parseAppRouteUrl('https://sky/iss')).toBeNull();
    expect(parseAppRouteUrl('javascript://sky/iss')).toBeNull();
  });
});
