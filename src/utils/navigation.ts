import { AppRoute, Tab } from '../types';

const ROUTES: AppRoute[] = ['today', 'sky', 'sky:targets', 'sky:ar', 'sky:iss', 'sky:satellites', 'sky:apod', 'plan', 'plan:meteor', 'settings', 'settings:notifications'];

export const isAppRoute = (value: unknown): value is AppRoute => typeof value === 'string' && ROUTES.includes(value as AppRoute);

export const tabForRoute = (route: AppRoute): Tab => {
  if (route === 'sky' || route.startsWith('sky:')) return 'sky';
  if (route === 'plan' || route.startsWith('plan:')) return 'plan';
  if (route === 'settings' || route.startsWith('settings:')) return 'settings';
  return 'today';
};

export const rootRouteForTab = (tab: Tab): AppRoute => tab === 'today' ? 'today' : tab;

export const parseAppRouteUrl = (url: string): AppRoute | null => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'skyview:') return null;
    const candidate = `${parsed.hostname}${parsed.pathname}`.replace(/^\/+|\/+$/g, '').replace('/', ':');
    return isAppRoute(candidate) ? candidate : null;
  } catch { return null; }
};
