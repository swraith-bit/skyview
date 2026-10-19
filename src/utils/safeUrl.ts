const TRUSTED_APOD_VIDEO_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
]);

export const getSafeHttpsUrl = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export const getSafeMediaUrl = (value: string | undefined): string | null => {
  if (!value) return null;
  if (value.startsWith('/assets/') && !value.includes('..') && !value.startsWith('//')) {
    return value;
  }
  if (value.startsWith('data:image/svg+xml,') || value.startsWith('data:image/svg+xml;utf8,') || value.startsWith('data:image/webp;base64,')) {
    return value;
  }
  return getSafeHttpsUrl(value);
};

export const getTrustedApodEmbedUrl = (value: string | undefined): string | null => {
  const safeUrl = getSafeHttpsUrl(value);
  if (!safeUrl) return null;

  const parsed = new URL(safeUrl);
  if (!TRUSTED_APOD_VIDEO_HOSTS.has(parsed.hostname.toLowerCase())) return null;

  const isYouTubeEmbed = parsed.hostname.toLowerCase() !== 'player.vimeo.com'
    && (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/v/'));
  const isVimeoEmbed = parsed.hostname.toLowerCase() === 'player.vimeo.com'
    && parsed.pathname.startsWith('/video/');

  return isYouTubeEmbed || isVimeoEmbed ? parsed.toString() : null;
};

export const isSafeMp4Url = (value: string | undefined): boolean => {
  const safeUrl = getSafeHttpsUrl(value);
  return safeUrl ? new URL(safeUrl).pathname.toLowerCase().endsWith('.mp4') : false;
};
