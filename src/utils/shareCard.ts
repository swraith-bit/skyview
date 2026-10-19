import { shareImageNative } from '../native/shareImage';

export interface ShareCardData {
  dateLabel: string;
  locationName: string;
  windowHeading: string;
  windowLabel: string;
  score: number;
  cloudLabel: string;
  moonLabel: string;
  targetsHeading: string;
  targets: string[];
  footer: string;
}

export type ShareCardResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

// Deterministik yıldız alanı: aynı gece aynı kart üretilsin.
const mulberry32 = (seed: number) => () => {
  let value = seed += 0x6D2B79F5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const drawPill = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
) => {
  ctx.font = '600 30px Outfit, sans-serif';
  const width = ctx.measureText(text).width + 56;
  ctx.fillStyle = 'rgba(99, 102, 241, 0.16)';
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 60, 30);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c7d2fe';
  ctx.fillText(text, x + 28, y + 40);
  return width;
};

export const renderObservationCard = async (data: ShareCardData): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable.');

  const background = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  background.addColorStop(0, '#050816');
  background.addColorStop(0.55, '#0b1220');
  background.addColorStop(1, '#02040a');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const random = mulberry32(20261019);
  for (let index = 0; index < 190; index++) {
    const x = random() * CARD_WIDTH;
    const y = random() * CARD_HEIGHT * 0.78;
    const radius = random() * 2.4 + 0.6;
    ctx.fillStyle = `rgba(226, 232, 240, ${0.18 + random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const horizon = ctx.createRadialGradient(CARD_WIDTH / 2, CARD_HEIGHT * 0.72, 40, CARD_WIDTH / 2, CARD_HEIGHT * 0.72, 560);
  horizon.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
  horizon.addColorStop(1, 'rgba(2, 4, 10, 0)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, CARD_HEIGHT * 0.45, CARD_WIDTH, CARD_HEIGHT * 0.5);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#818cf8';
  ctx.font = '700 30px "JetBrains Mono", monospace';
  ctx.fillText('SKYVIEW', 88, 150);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 34px Outfit, sans-serif';
  ctx.fillText(data.dateLabel, 88, 232);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 66px Outfit, sans-serif';
  const locationLines = wrapLines(ctx, data.locationName, CARD_WIDTH - 176).slice(0, 2);
  locationLines.forEach((line, index) => ctx.fillText(line, 88, 312 + index * 74));

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(88, 470);
  ctx.lineTo(CARD_WIDTH - 88, 470);
  ctx.stroke();

  ctx.fillStyle = '#818cf8';
  ctx.font = '600 30px Outfit, sans-serif';
  ctx.fillText(data.windowHeading.toUpperCase(), 88, 560);

  ctx.fillStyle = '#7dd3fc';
  ctx.font = '700 84px "JetBrains Mono", monospace';
  const windowLines = wrapLines(ctx, data.windowLabel, CARD_WIDTH - 176).slice(0, 2);
  windowLines.forEach((line, index) => ctx.fillText(line, 88, 664 + index * 96));

  drawPill(ctx, 88, 840, data.cloudLabel);
  drawPill(ctx, 88 + ctx.measureText(data.cloudLabel).width + 120, 840, data.moonLabel);

  // Skor halkası
  const ringX = CARD_WIDTH - 220;
  const ringY = 640;
  const ringRadius = 96;
  ctx.lineWidth = 18;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.beginPath();
  ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = data.score >= 70 ? '#34d399' : data.score >= 40 ? '#fbbf24' : '#fb7185';
  ctx.beginPath();
  ctx.arc(ringX, ringY, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (Math.max(0, Math.min(100, data.score)) / 100));
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 62px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(data.score)), ringX, ringY + 12);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 26px Outfit, sans-serif';
  ctx.fillText('/100', ringX, ringY + 50);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 38px Outfit, sans-serif';
  ctx.fillText(data.targetsHeading, 88, 1040);

  data.targets.slice(0, 3).forEach((target, index) => {
    const y = 1130 + index * 110;
    ctx.fillStyle = 'rgba(129, 140, 248, 0.9)';
    ctx.beginPath();
    ctx.arc(104, y - 14, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 44px Outfit, sans-serif';
    const line = wrapLines(ctx, target, CARD_WIDTH - 260)[0] ?? target;
    ctx.fillText(line, 136, y);
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '500 26px Outfit, sans-serif';
  ctx.fillText(data.footer, 88, CARD_HEIGHT - 90);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Share card could not be encoded.'));
    }, 'image/png');
  });
};

type ShareNavigator = Navigator & {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
};

/**
 * TUR 2 / Faz 6.4 — Kozmik gözlem kartı. Web Share API varsa dosya olarak
 * paylaşır; yoksa PNG indirir. Paylaşım iptali hata olarak raporlanmaz.
 */
export const shareObservationCard = async (data: ShareCardData): Promise<ShareCardResult> => {
  try {
    const blob = await renderObservationCard(data);
    // Android WebView'de Web Share API yok; PNG'yi native paylaşım sayfasına ver.
    if (await shareImageNative(blob, 'skyview-observation.png', 'SkyView', data.locationName)) {
      return 'shared';
    }
    const file = new File([blob], 'skyview-observation.png', { type: 'image/png' });
    const navigatorWithShare = navigator as ShareNavigator;
    if (navigatorWithShare.share && navigatorWithShare.canShare?.({ files: [file] })) {
      await navigatorWithShare.share({ files: [file], title: 'SkyView', text: data.locationName });
      return 'shared';
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'skyview-observation.png';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    return 'downloaded';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    console.warn('Observation card could not be shared.', error);
    return 'failed';
  }
};
