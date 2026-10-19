import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * F6.8 — Haptic söz varlığı (tek modül, tek guard):
 *
 *  Söz varlığı = kullanıcı eyleminin "tonu". Her yerde aynı eşleme kullanılır;
 *  ekranlar kendi Impact seçimini icat etmez:
 *
 *  | Eylem tonu                | Fonksiyon          | Kapasitör karşılığı      |
 *  |---------------------------|--------------------|--------------------------|
 *  | seçim tik (nav/filtre)    | `selectionHaptic`  | `selectionChanged()`     |
 *  | tamamlanan işlem (Light)  | `successHaptic`    | `impact(Light)`          |
 *  | yıkıcı/geri-döndürülemez  | `warningHaptic`    | `impact(Medium)`         |
 *
 *  Kurallar:
 *  - Yalnızca native platformda tetiklenir (web'de sessiz çıkış) ve hata
 *    yutulur — dokunsal geri bildirim opsiyoneldir, asla akışı bozmaz.
 *  - `void …Haptic()` çağrısı: unhandled promise kirliliği olmasın; eslint
 *  zorunlu akışa uyar.
 */

const impactHaptic = async (style: ImpactStyle): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try { await Haptics.impact({ style }); } catch { /* Optional hardware feedback. */ }
};

/** Sekme/araç/filtre/segment seçimleri için kayıt-tik. */
export const selectionHaptic = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try { await Haptics.selectionChanged(); } catch { /* Optional hardware feedback. */ }
};

/** Tamamlanan işlem: gözlem kaydı, ekran görüntüsü, plan ekleme onayı. */
export const successHaptic = (): Promise<void> => impactHaptic(ImpactStyle.Light);

/** Yıkıcı/geri-alınamaz eylem: plan satırı silme gibi onay-yok silmeler. */
export const warningHaptic = (): Promise<void> => impactHaptic(ImpactStyle.Medium);

/**
 * AR hedef kilidi: kısa çift vuruş (F6.1). Tek `impact` çağrısı iki ayrı
 * darbeyi ayırt edemediği için iki darbe arasında ~70 ms bırakılır.
 */
export const lockHaptic = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
    await new Promise(resolve => setTimeout(resolve, 70));
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* Optional hardware feedback. */ }
};
