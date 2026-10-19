import { afterEach, describe, expect, it, vi } from 'vitest';
import { APODFetchError, fetchApod, getFallbackImages } from './apodService';

describe('APOD service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pins the requested APOD date in the query and types HTTP errors', async () => {
    const fetchMock = vi.fn(async (input: unknown) => {
      void input;
      return { ok: false, status: 429 };
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchApod('2026-10-17')).rejects.toMatchObject({
      name: 'APODFetchError',
      status: 429,
    } satisfies Partial<APODFetchError>);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('date=2026-10-17');
  });

  it('returns translated fallback images instead of raw i18n keys', () => {
    const images = getFallbackImages('tr');

    expect(images).toHaveLength(3);
    expect(images.every(image => !image.title.startsWith('apod.'))).toBe(true);
    expect(images.every(image => !image.explanation.startsWith('apod.'))).toBe(true);
  });
});
