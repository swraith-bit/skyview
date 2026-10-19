import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

interface SkyThemePlugin {
  getScotopic(): Promise<{ enabled: boolean }>;
  setScotopic(options: { enabled: boolean }): Promise<void>;
  addListener(
    eventName: 'scotopicChanged',
    listener: (data: { enabled: boolean }) => void,
  ): Promise<PluginListenerHandle>;
}

const SkyTheme = registerPlugin<SkyThemePlugin>('SkyTheme');

const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';

/** Açılışta karonun kalıcı durumunu okur. Web'de her zaman false. */
export const readScotopicTile = async (): Promise<boolean> => {
  if (!isAndroid()) return false;
  try {
    const result = await SkyTheme.getScotopic();
    return result.enabled === true;
  } catch (error) {
    console.warn('Scotopic tile state could not be read.', error);
    return false;
  }
};

/** Uygulamadaki tema seçimini karoya yansıtır (karo ile tek kaynak). */
export const syncScotopicTile = async (enabled: boolean): Promise<void> => {
  if (!isAndroid()) return;
  try {
    await SkyTheme.setScotopic({ enabled });
  } catch (error) {
    console.warn('Scotopic tile state could not be synced.', error);
  }
};

/** Karonun canlı değişimini dinler; temizlik için handle döner. */
export const addScotopicTileListener = async (
  listener: (enabled: boolean) => void,
): Promise<PluginListenerHandle | null> => {
  if (!isAndroid()) return null;
  try {
    return await SkyTheme.addListener('scotopicChanged', data => listener(data.enabled === true));
  } catch (error) {
    console.warn('Scotopic tile listener could not be registered.', error);
    return null;
  }
};
