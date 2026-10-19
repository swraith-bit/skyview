# SkyView — UI/UX Geliştirme Yol Haritası v6.0

> **Belge Türü:** v5.0 Master Yol Haritası'nın **tamamlayıcı / boşluk doldurucu** planı
> **Tarih:** 19 Ekim 2026
> **Platform:** Android-first (Capacitor 8 + React 19 + Tailwind v4 + Three.js + Motion v12)
> **Referans:** `SKYVIEW_MASTER_UI_UX_ROADMAP.md` (v5.0) — tema motoru, zaman kadranı, AR HUD, 3D Ay orada tanımlı. Bu belge, v5'in **çözmediği** deneyim sorunlarını ele alır.

---

## 🧭 0. Rasyonel: v5.0 neyi çözüyor, neyi bırakıyor?

v5.0 güçlü bir **"saha aleti"** vizyonu (kırmızı mod, zaman ekseni, AR kilitlenme). Ancak bir ürünün tamamlanması için şu katmanlar da gerekir — bunlar ilk kez bu belgede kapsamlı ele alınıyor:

| Eksik Katman | Neden Kritik |
|---|---|
| İlk açılış / onboarding | İzin akışı (konum, sensör, bildirim) kötü olursa kullanıcı ilk 30 saniyede kaybedilir |
| Gözlem günlüğü & oturum akışı | Uygulamanın "veri panosundan hobi arkadaşı"na dönme yolu: kullanıcının kendi kaydını tutması |
| Hava & gökyüzü algısı dili | "Skor 85/100" soyut; skoru *fiziğiyle* hissettiren görsel bir dil yok |
| Sistem entegrasyonu (Material You) | Android kullanıcısı native his bekliyor; WebView uygulamaları genelde "yabıncık kutu" gibi duruyor |
| Kesinti / hata / boş durum estetiği | Gökyüzü uygulamasının en kötü anı: bulutlu gece + çekmeyen internet. O ekran da iyi tasarlanmalı |
| Erişilebilirlik (font dışı) | Kontrast, TalkBack ile gökyüzü navigasyonu, tek el + eldivenli kullanım |

---

## ⭐ 1. Yeni Fikir Kataloğu

### A. 60 Saniyelik "İlk Gökyüzü" Onboarding'i
- **Akış:** Splash (hafif yıldız alanı, <1s) → konum izni tek ekran + "neden gerekiyor?" şeffaf gerekçesi → anında kullanıcının bu geceki gökyüzü önizlemesi ("Senin gökyüzünde bu gece 14 harika hedef var") → opsiyonel bildirim izni (ISS geçişleri için).
- **Kural:** İZİNSİZ de uygulama tam çalışır (varsayılan konum + "Konumu düzelt" bandı). İzin duvarı yasaktır.

### B. Gözlem Günlüğü (Observation Logbook) — Ürünün Kalbi
`features/observation` altyapısına bağlanır:
- **Oturum başlat:** "Bu geceyi planla" dendiğinde başlayan bir gözlem oturumu (tarih, konum, ekipman, hedef listesi + hava anlık görüntüsü).
- **Hedef işaretleyici:** Her hedefte tek dokunuş "gördüm ✓" — saat, görünürlük notu (1–5 yıldız), kısa not, opsiyonel fotoğraf.
- **Kişisel gelişim:** Hedef başına "kaç kez gördüm, son ne zaman gördüm" sayacı; "Orion'ı 3 mevsimde gördün" gibi abartısız ilerleme rozetleri.
- **Yılın hikâyesi:** Yıl sonunda kişisel özet — kaç gecede gözlem yapıldı, toplam kaç saat baş kaldırıldı, kaç hedef tamamlandı.
- **%100 yerel** (offline-first). v5'in reddettiği zorunlu bulut senkronu prensibi korunur.

### C. Gökyüzü Durumu Dili (Conditions Visual Grammar)
Soyut skoru fiziksel bir görsel dile çevirir:
- **Ay şeridi:** Ay ışığı kirliliğini gösteren incelen/pes eden şerit ("Ay %70 dolu — hedef gölgelenebilir").
- **Bulut bantları:** Saat bazlı bulut örtüsü + "gezegen yükselirken bulut nerede" bilgisi.
- **Karanlık adaptasyon sayacı:** Kırmızı moda geçildiğinde "gözlerin 10 dakika sonra tam karanlığa adapte olacak" geri sayımı.
- **24 saatlik birleşik hava çizelgesi:** Bulut / rüzgâr / görünürlük üst üste tek yatay bant — v5'in zaman kadranıyla aynı zihinsel modelde.

### D. Android Native Dizgi (Material You + WebView köprüsü)
- **Dynamic Color:** Android 12+ duvar kağıdı renginden `--sv-brand` token'ına uyarlama (karanlık mod kontrastı korunarak).
- **Edge-to-edge:** AR ekranında gerçekten tam ekran; sistem barları ile uyumlu "esnek" üst bilgi şeridi.
- **Predictive back:** BottomSheet kademeleri ve AR modundan çıkış, Android 14+ tahmin edici geri animasyonuyla uyumlu.
- **Widget (4x1):** "Bu gece skoru 82 · ISS 21:14'te geçecek" — gözlem kararı evden çıkmadan verilsin.

### E. Kötü Gece Modu (SkyClosedMode)
Bulutlu/fırtınalı gece kullanıcıyı bomboş ekranda bırakma:
- Gökyüzü kapalı olduğunda: APOD keşfi, Ay Laboratuvarı, Günlüğü incele/Başarımlardan biri önerilir.
- "Hava kötü" bir hata değil; uygulamanın sunabileceği zengin bir alternatif akıştır.

### F. Tek El Modu ve Hareketler
- Tüm kritik eylemler ekranın **alt yarısında**; ana hedef alanları ≥ 48dp (eldivenli kullanım).
- Çift dokunuş AR'da: hedef kilitle (v5 ile uyumlu).
- Dock'ta uzun basış: "şu an ufukta olanlar" hızlı listesi.

### G. Boşluk / Yüklenme / Hata Estetiği
- **Yıldız iskeleti:** Klasik gri kutular yerine, dalga halinde yakan küçük yıldız noktaları.
- **Offline durum bannerı değil, durum bilgisi:** "Hava verisi 2 saat önce alındı" — dürüst, panik yok.
- **Hata kartları:** Teknik metin yerine sade, çözüm öneren öneri kartı + "Tekrar Dene".

### H. Mikro-Etkileşimler (v5 F6'ya ekleme)
- "Gördüm" işaretinde yumuşak tek seferlik parıltı (sürekli döngüde değil).
- ISS geçiş rozetinde küçük roket izi vurgusu.
- Haptik yalnızca önemli anlarda: hedef kilitlenme, yeni hedef keşfi (pil ile uyumlu).

---

## 🗺️ 2. Yol Haritası (7 Faz)

```
G0 ██   Onboarding & İzin Akışı + Splash                          (S–M)
G1 ████ Gözlem Günlüğü çekirdeği: Oturum + "Gördüm" + Notlar      (L)
G2 ███  Gökyüzü Durumu Dili + 24s Birleşik Hava Çizelgesi         (M)
G3 ██   Kötü Gece Modu + Boşluk/Hata/Yükleme Estetiği             (S)
G4 ███  Android Native Dizgi: Material You + Widget + Back        (M)
G5 ██   Tek El Modu + Erişilebilirlik Geçişi (TalkBack, kontrast) (M)
G6 █    Rozetler + Yılın Hikâyesi + dışa aktarım                  (M)
```

> **Not:** v5'in FAZ 1–6 sırası ile paralel; bu fazlar onun yerine geçmez, onları tamamlar. Öneri: v5 F1 (tema motoru) bittikten sonra bu listedeki G0–G3'e başlanır.

### G0 — Onboarding & İlk Gökyüzü
*Efor: S–M · Kalite Kapısı: İzinsiz açılışta uygulama tam fonksiyonel; onboarding süresi < 60 sn*
- [ ] Splash: < 1sn, düşük güçlü yıldız alanı
- [ ] Konum izni ekranı + şeffaf gerekçe ("neredeysen gökyüzün oraya göre")
- [ ] Onboarding bitişinde kişisel gökyüzü önizlemesi (ilk "vay" anı)
- [ ] Sıfır izin durumunda degrade değil: varsayılan konum + düzeltme bandı

### G1 — Gözlem Günlüğü Çekirdeği
*Efor: L · Kalite Kapısı: %100 offline; veri katmanı testleri yeşil*
- [ ] `LogbookContext` + yerel kalıcılık (mevcut `store` katmanına uygun)
- [ ] Oturum yaratma: tarih, konum, ekipman, hedef listesi
- [ ] "Gördüm" tek dokunuş + 1–5 not + kısa metin + opsiyonel fotoğraf
- [ ] Hedef başına gelişim sayacı (kaç kez, son tarih)
- [ ] Günlük ekranı: zaman çizelgeli geçmiş kayıtlar

### G2 — Gökyüzü Durumu Dili
*Efor: M · Kalite Kapısı: 24s çizelge kaydırması 60fps; v5 zaman kadranıyla senkron*
- [ ] Ay/bulut/karanlık adaptasyon şeridi bileşeni
- [ ] 24 saatlik birleşik hava çizelgesi
- [ ] Kırmızı moda bağlanan karanlık adaptasyon sayacı
- [ ] Skorun *nedeni*: skor halkasının altında faktör kırılımı (ay %40 düşürdü, bulut %10 düşürdü)

### G3 — Kötü Gece Modu + Durum Estetiği
*Efor: S · Kalite Kapısı: Her boş durumda somut bir öneri bulunmalı*
- [ ] `SkyClosedMode`: kapalı gökyüzü alt sayfa içeriği (APOD / Ay / Günlük / Başarımlar)
- [ ] Veri tazeliği Embedded timestamp yaklaşımı (v5.0'dan gelen `DataFreshness.tsx` genişletilmesi)
- [ ] Yıldızlı skeleton bileşeni + düşük güç tercihleri
- [ ] Hata kartı tasarım standardı (mevcut `EmptyState.tsx` / `Toast.tsx` çerçevesi üzerine)

### G4 — Android Native Dizgi
*Efor: M · Kalite Kapısı: Android 14+ cihazda manuel QA; predictive back ile LIFO düzeni korunmalı*
- [ ] Dynamic Color (`--sv-brand` adaptasyonu, kontrast güvencesi)
- [ ] Edge-to-edge + sistem barları uyumu (AR tam ekran)
- [ ] Predictive back entegrasyonu (BottomSheet kademeleri, AR modu)
- [ ] 4x1 Widget: gece skoru + sonraki ISS geçişi

### G5 — Tek El & Erişilebilirlik Geçişi
*Efor: M · Kalite Kapısı: TalkBack'te tüm ana akış gezilebilir; %200 font ölçeğinde test*
- [ ] Dokunma hedefi denetimi (≥48dp)
- [ ] Gökyüzü haritası için TalkBack stratejisi (bölge bazlı anlatım; tüm yönler için)
- [ ] WCAG AA kontrast denetimi (v5'teki tüm temalara göre)
- [ ] `prefers-reduced-motion` tam desteği (BODY indirgenmiş hareket tercihi)

### G6 — Oyunlaştırma & Hikâye
*Efor: M · Kalite Kapısı: Tüm rozetler veri kuralına bağlı (şans değil); paylaşıldığında offline üretilir*
- [ ] Başarım sistemi: 12–15 rozet (mevsim, parlaklık, kategoriler)
- [ ] "Yılın Gökyüzü Hikâyesi": paylaşılabilecek statik görsel üretimi
- [ ] Günlük dışa aktarım (JSON/CSV) + rozet istatistikleri

---

## 📏 3. Başarı Metrikleri

| Metrik | Hedef |
|---|---|
| Onboarding bitirip 7 gün içinde oturum başlatan oranı | ≥ %45 |
| "Gördüm" işaretleyen kullanıcı oranı | ≥ %30 |
| Oturum başına ortalama kayıt | ≥ 3 hedef |
| AR'da hedef kilitleme başarı oranı | ≥ %85 |
| Kötü gece modunda harcanan süre (iyi gece tabanına oran) | ≥ %60 |
| Cold start < 1.5s · zaman kaydırma < 150ms (v5 kapısı korunur) | geç |
| TalkBack ile tam gezi, %200 font ölçeği testi | geç |

---

## 🎯 4. Öncelik Tavsiyesi

1. **G0 Onboarding** — en kısa, en büyük etki; her şeyin tavanı.
2. **G1 Günlük** — ürünün ruhu; diğer ekrandan bağımsız geliştirilebilir.
3. **G3 Kötü Gece Estetiği** — küçük efor, görünür büyük fark.
4. Ardından **G2 → G4 → G5 → G6**; v5 fazlarıyla serpiştirilerek.

> **Birleşme fikri:** v5 (saha aleti) + v6 (kişisel gözlem arkadaşı) birlikte tamamlandığında SkyView, *"gecenin kararını tek ekranda ver"* + *"kendi gökyüzü hikâyeni yaz"* konumlamasıyla ayırt edici bir ürün olur.

---

*Bu belge şimdilik sadece yol haritası; uygulama başlamadı. Uygulamaya girildiğinde her faz, proje standardı olan 222 test / sıfır lint kalite kapısını geçmek zorundadır.*
