import { describe, expect, it } from 'vitest';
import { getSafeHttpsUrl, getTrustedApodEmbedUrl, isSafeMp4Url } from './safeUrl';

describe('safe external URLs', () => {
  it('accepts HTTPS and rejects executable or local schemes', () => {
    expect(getSafeHttpsUrl('https://apod.nasa.gov/image.jpg')).toBe('https://apod.nasa.gov/image.jpg');
    expect(getSafeHttpsUrl('http://apod.nasa.gov/image.jpg')).toBeNull();
    expect(getSafeHttpsUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeHttpsUrl('data:text/html,test')).toBeNull();
    expect(getSafeHttpsUrl('file:///tmp/image.jpg')).toBeNull();
  });

  it('allows only trusted APOD embed hosts and embed paths', () => {
    expect(getTrustedApodEmbedUrl('https://www.youtube.com/embed/abc')).toBe('https://www.youtube.com/embed/abc');
    expect(getTrustedApodEmbedUrl('https://player.vimeo.com/video/123')).toBe('https://player.vimeo.com/video/123');
    expect(getTrustedApodEmbedUrl('https://www.youtube.com/watch?v=abc')).toBeNull();
    expect(getTrustedApodEmbedUrl('https://example.com/embed/abc')).toBeNull();
  });

  it('recognizes MP4 media only after HTTPS validation', () => {
    expect(isSafeMp4Url('https://example.nasa.gov/movie.mp4?download=1')).toBe(true);
    expect(isSafeMp4Url('http://example.nasa.gov/movie.mp4')).toBe(false);
  });
});
