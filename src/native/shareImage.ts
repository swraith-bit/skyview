import { Capacitor, registerPlugin } from '@capacitor/core';

interface SkySharePlugin {
  shareImage(options: {
    base64: string;
    filename: string;
    title: string;
    text: string;
  }): Promise<{ shared: boolean }>;
}

const SkyShare = registerPlugin<SkySharePlugin>('SkyShare');

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Blob could not be read.'));
    reader.readAsDataURL(blob);
  });

/**
 * TUR 2 / Faz 6.4 — Android paylaşım sayfası. WebView'de Web Share API ve
 * blob indirme güvenilir olmadığı için PNG native köprüden paylaşılır.
 */
export const shareImageNative = async (
  blob: Blob,
  filename: string,
  title: string,
  text: string,
): Promise<boolean> => {
  if (Capacitor.getPlatform() !== 'android') return false;
  try {
    const base64 = await blobToBase64(blob);
    const result = await SkyShare.shareImage({ base64, filename, title, text });
    return result.shared === true;
  } catch (error) {
    console.warn('Native image share failed.', error);
    return false;
  }
};
