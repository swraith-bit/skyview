# SkyView — DOKÜMAN ARŞİVİ (2026-10-17, 8 kod oturumu sonrası)

> Bu dosya append-only arşivdir; yeni oturumların okuması gerekmez.
> İçerik: ROADMAP.md (v2) ve AUDIT_REPORT.md'nin tam hali, sıkıştırma öncesi.
> Geçmiş oturumların ('birinci… sekizinci' kod oturumu) ayrıntılı kayıtları buradaki
> iki bölümdedir. Aktif dokümanlar: ROADMAP.md (v3), AUDIT_REPORT.md (v2-sıkışık).

---
---
# ARŞİV BÖLÜMÜ 1 — ROADMAP.md (v2, sıkıştırma öncesi tam içerik)
# SkyView â€” DÃ¼zeltme & Modernizasyon Yol HaritasÄ± (v2 â€” kalan iÅŸler)

> GÃ¼ncelleme: 2026-10-17. **Faz 0 ve Faz 1 tamamen tamamlandÄ±**; APOD/ISS hata yollarÄ±,
> konum/saat-dilimi, wake lock, AR yakalama, .env ve dev-CSP dahil. Faz 0'Ä±n "gerÃ§ek veri"
> Ã§Ã¶zÃ¼mÃ¼ **F2.3/Â§3.3'Ã¼ de kapattÄ±** (kalan tek iÅŸ cihazda gÃ¶rsel doÄŸrulama).
> **Ä°kinci dÃ¼zeltme turu (2026-10-17, Faz 2 kod oturumu):** F2.1, F2.2, F2.5, F2.6, F2.8 ve
> F5.1 kod ile kapandÄ± (bkz. "Tamamlanan Fazlar"). Faz 2'de kalan tek iÅŸ **CÄ°HAZ DOÄRULAMA
> GÃœNÃœ (Â§C.1/Â§C.2/Â§C.3/Â§C.5 + F2.4 gerekirse iÅŸaret dÃ¼zeltmesi)** ve F2.7 (sensÃ¶r yedeÄŸi) idi.
> **ÃœÃ§Ã¼ncÃ¼ dÃ¼zeltme turu (2026-10-17, kod oturumu â€” Ã¼Ã§):** F2.7 kapandÄ± â†’ **Faz 2'nin kod
> tarafÄ± bitti, kalan tamamen cihaz gÃ¼nÃ¼**. AyrÄ±ca Faz 4'Ã¼n ilk kÄ±rÄ±lÄ±mÄ±: F4.3 (ISS iz
> matematiÄŸi), F4.5 (hata kanallarÄ±) ve F4.2 (stale UI) kod ile kapandÄ±. AÃ§Ä±k kalan kod
> fikstÃ¼rleri: F3.1-F3.6, F4.1, F4.4, F5.2-F5.7, Faz 6.
> **DÃ¶rdÃ¼ncÃ¼ dÃ¼zeltme turu (2026-10-17, kod oturumu â€” dÃ¶rt):** **F4.1 ve F4.4 kapandÄ± â†’
> Faz 4'Ã¼n kod tarafÄ± bitti (Â§3.6 eÅŸik UI'si hariÃ§, F4.4 altÄ±ndan Faz 6'ya taÅŸÄ±ndÄ±)**.
> AyrÄ±ca cihaz baÄŸÄ±msÄ±z gerÃ§ek: `arSkyGuides.ts`'te astronomy-engine `Vector` 4-arg imza
> uyumu (tsc'i bloke eden tek hata). Kalan kod fikstÃ¼rleri: **F3.1-F3.6, F5.2-F5.7, Faz 6**.
> **BeÅŸinci dÃ¼zeltme turu (2026-10-17, kod oturumu â€” beÅŸ, Faz 3):** **F3.1, F3.2, F3.4 ve
> F3.6 kapandÄ±** â€” worker singleton (`astronomyWorkerClient.ts` + istek-id protokolÃ¼),
> gÃ¶rÃ¼nÃ¼r-dakika kapÄ±sÄ± (`isMinuteTickDue`), seÃ§icili abonelikler (4 dosya), GPU resize
> floor-guard + `forceContextLoss` + kare-baÅŸÄ±na Set silinmesi, App WorkManager yuvarlanmÄ±ÅŸ
> koordinat anahtarÄ±, `useWeatherQuery` tek Ã¶nbellek anahtarÄ±, APOD lazy+memo,
> `Intl.DateTimeFormat` Ã¶nbelleÄŸi, `estimateBortleScale` memo. **Faz 3'te kalan:
> F3.3 ve F3.5 (her ikisi L)**. Kalan kod fikstÃ¼rleri: **F3.3, F3.5, F5.2-F5.7, Faz 6**.
> **AltÄ±ncÄ± dÃ¼zeltme turu (2026-10-17, kod oturumu â€” altÄ±, Faz 3 kapanÄ±ÅŸÄ±):** **F3.3 ve
> F3.5 kapandÄ± â†’ Faz 3'Ã¼n kod tarafÄ± tamamen bitti**. F3.5: yeni `astroEventSearch.ts`
> (worker-safe ham matematik), astronomy worker `events` istek tipi
> (`requestAstroEventsFromWorker`), `useAstroEventsQuery` (15 dk staleTime + gÃ¼n-anahtarlÄ±
> Ã¶nbellek) â€” AstroEventsHub dakika tik'inde artÄ±k 3 yÄ±llÄ±k tutulma aramasÄ± + 60 gÃ¼nlÃ¼k
> gezegen sÃ¼pÃ¼rmesi Ã‡ALIÅTIRMIYOR. F3.3: `getContext('2d')` etkinlik-baÅŸÄ±na, `Observer`/
> `MakeTime` 1 Hz penceresinde, `CELESTIAL_BODIES` modÃ¼l sabiti, `Object.values()` zincirleri
> dÃ¼z listelerle deÄŸiÅŸti ve twinkle fazÄ± yÄ±ldÄ±z kimliÄŸinden tÃ¼retiliyor (Â§4.5 kalan bulgusu).
> Kalan kod fikstÃ¼rleri: **F5.2-F5.7, Faz 6**. Kalan cihaz iÅŸi: **Â§C cihaz doÄŸrulama gÃ¼nÃ¼**.
> **Yedinci dÃ¼zeltme turu (2026-10-17, kod oturumu â€” yedi, Faz 5 ilk paket):** **F5.2, F5.5,
> F5.7 ve F5.6 kapandÄ±** â€” storage diagnostics kanca katmanÄ± (`setStorageDiagnosticsListener`
> + dairesel-import'suz `installStorageDiagnostics` kablosu, self-echo guard), LPM ResizeObserver
> (`invalidateSize`) + uÃ§uÅŸ-yarÄ±ÅŸÄ± mounted-guard'larÄ±, a11y hÄ±z kazanÃ§larÄ± (GPS FAB/kapat
> aria-label, HourlyCloudChart divâ†’button + klavye odaÄŸÄ± paritesi, form/range/search label'larÄ±),
> i18n saÄŸlamlÄ±k (ana katalog + i18nExtra 8 dil parite testleri, worker-safe `compass.ts` +
> `compass.*` kÄ±saltma katalogu 8 dil, `getMoonPhase` lang yolu, `dir` gÃ¶rÃ¼ntÃ¼ noktalarÄ±nÄ±n
> yerelleÅŸtirilmesi). **Faz 5'te kalan: F5.3 + F5.4 (modal ailesi)**. Kalan kod fikstÃ¼rleri:
> **F5.3, F5.4, Faz 6**. Kalan cihaz iÅŸi: **Â§C cihaz doÄŸrulama gÃ¼nÃ¼**.
> **Sekizinci düzeltme turu (2026-10-17/18, kod oturumu — sekiz, Faz 5 kapanışı):** **F5.4 ve F5.3 kapandı → Faz 5'in kod tarafı tamamen bitti.** StandardModal/BottomSheet tabanı (`ui/Modal.tsx` — CSS keyframe animasyon, `motion` Modal zincirinden çıkarıldı: chunk 147→18.7 kB; focus-trap callback-ref deseni) + 6 ekran migrasyonu (ARSkyMap arama/kalibrasyon, APOD lightbox, gök cismi detay, günlük BottomSheet, LPM); LIFO geri tuşu registry (`consumeBackButtonModal` pop semantiği, DOM-id hack silindi). Kalan kod fikstürleri: **yalnızca Faz 6**. Kalan cihaz işi: **§C (+C.11 geri-tuşu senaryosu)**.
> Bu sÃ¼rÃ¼m yalnÄ±zca kalan iÅŸleri taÅŸÄ±r; tamamlanan kayÄ±tlar "Tamamlanan Fazlar" bÃ¶lÃ¼mÃ¼nde.
> ID numaralarÄ± AUDIT_REPORT.md ile uyumlu bÄ±rakÄ±ldÄ±. Giderilenler â†’ AUDIT_REPORT.md Â§10.
> Efor Ã¶lÃ§eÄŸi: XS < 30 dk Â· S ~1-2 saat Â· M yarÄ±m gÃ¼n Â· L 1 gÃ¼n Â· XL 1 gÃ¼nden fazla

## Kalite AÄŸÄ± (her fazdan sonra koÅŸulacak) â€” gÃ¼ncel baseline

```bash
npm run lint    # hedef: 0 hata / 0 uyarÄ± (tsc --noEmit dahil) â€” mevcut: YEÅÄ°L
npm run test    # mevcut: 43 dosya / 185 test â€” hepsi yeÅŸil olmalÄ±
npm run build   # vite build hatasÄ±z â€” mevcut: YEÅÄ°L
```

Ã‡Ä±ktÄ± notu: `three-vendor >500 kB` uyarÄ±sÄ± mevcut; yalnÄ±zca Faz 3'te referans.
Cihaz doÄŸrulamasÄ±: Â§C (gÃ¼ncel) Android kontrol listesi.

---

## Faz 2 â€” AR Ã–zellik Tamamlama (kalan: yalnÄ±zca cihaz gÃ¼nÃ¼)

> Kod tarafÄ± kalemlerin tamamÄ± kapandÄ± (F2.1/F2.2/F2.5/F2.6/F2.8 + F2.7 Ã¼Ã§Ã¼ncÃ¼ oturumda).
> Faz 2'nin Ã§Ä±kÄ±ÅŸÄ± artÄ±k **cihaz doÄŸrulama gÃ¼nÃ¼ne** baÄŸlÄ±: Â§C.5 + Â§C.1 (+Â§C.2/Â§C.3/Â§C.10)
> telefonla koÅŸulur; F1.4 (preserveDrawingBuffer, object-fit:cover) ve F1.2/F1.3
> davranÄ±ÅŸlarÄ± cihazda teyit edilmeden Faz 4'e geÃ§ilmez. F2.4'Ã¼n Ã§ekirdek
> doÄŸrulamasÄ± da bu gÃ¼n iÃ§inde yapÄ±lÄ±r.

### âœ… F2.1 Katman toggle'larÄ± baÄŸlandÄ± â€” `ARSkyMap.tsx` + `arGpuScene.ts` + `arSkyGuides.ts`
Sahne kontrolleri paneline 3 anahtar eklendi (Izgara / Ekliptik / GÃ¶ksel Ekvator); grid Ã§izimi
`showGridRef`'e baÄŸlandÄ± (pusula harfleri hariÃ§); ekliptik (`Rotation_ECT_EQD`, 60 segment) ve
gÃ¶ksel ekvator (dec=0 taramasÄ±, 36 segment) halkalarÄ± 1 Hz Ã¶nbellekte Ã¼retilip Canvas
fallback'ta kesik Ã§izgilerle, GPU'da ayrÄ± soluk `guideLines` LineSegments katmanÄ±nda Ã§iziliyor.
Testler: `arSkyGuides.test.ts` (GÃ¼neÅŸ'e <1Â° yakÄ±nlÄ±k, halka sÃ¼rekliliÄŸi, Â±(90âˆ’Ï†) tepe/Ã§ukur),
`arGpuScene.test.ts` guide tampon/bÃ¼yÃ¼me. **Kalan: cihazda gÃ¶rsel doÄŸrulama.**

### âœ… F2.2 `fieldMode`/gece-vizyon uyumu â€” `ARSkyMap.tsx` + `index.css`
`isRedMode = nightMode || fieldMode` GPU `nightVision` param'Ä±na ve kap CSS'ine baÄŸlandÄ±;
AR aÃ§Ä±kken `skyview-ar-open` sÄ±nÄ±fÄ±yla app-overlay yumuÅŸatÄ±ldÄ± ve video CSS filtresine
muaf tutuldu (Ã§ift kÄ±zÄ±l tonlama Ã¶nlendi; capture akÄ±ÅŸÄ± filtresiz feed'i koruyor).
**Kalan: cihazda doÄŸrulama (gece modu + AR birlikte).**

### F2.3-rezidÃ¼el gezegen kartÄ± â€” cihazda gÃ¶rsel doÄŸrulama Â· Efor: XS
Kart deÄŸerleri gerÃ§ek (Faz 0). Kalan: cihazda JÃ¼piter â‰ˆ âˆ’2,7; NeptÃ¼n â‰ˆ 30,1 AU teyidi.

### F2.4 AR projeksiyon doÄŸrulamasÄ± ve (gerekirse) iÅŸaret dÃ¼zeltmesi â€” `ARSkyMap.tsx:473-501` Â· Efor: L *(cihaz gÃ¼nÃ¼)*
**Kod tarafÄ± tamam:** `screen.orientation.angle` standardÄ± (legacy `window.orientation` fallback);
`zd === 0` guard'Ä± mevcut `effZd` dalÄ±nÄ±n kapsadÄ±ÄŸÄ± teyit edildi.
**Kalan (cihazda):** Â§C.5 senaryosu â€” kuzeye bakan telefonla, doÄŸuda gÃ¶rÃ¼nen bir yÄ±ldÄ±zÄ± hedefle.
YanlÄ±ÅŸsa: Ã§ift eksen negatiflemesini cihaz-Ã§erÃ§eve modeline gÃ¶re tek noktadan dÃ¼zelt;
`arCameraModel.test.ts`'e altÄ±n test ekle.

### âœ… F2.5 Zaman yolculuÄŸu Ã¶nbelleÄŸi â€” `ARSkyMap.tsx`
1 Hz az/alt Ã¶nbellek anahtarÄ±na `timeTravelHoursRef` eklendi; Â±120 sa ofset deÄŸiÅŸimi anÄ±nda
yeniden hesabÄ± tetikliyor.

### âœ… F2.6 Kamera/permisyon hatalarÄ±nÄ±n sÄ±nÄ±flandÄ±rmasÄ± â€” `useCameraStream.ts` + `ARSkyMap.tsx`
`classifyCameraError`: `NotAllowedError/SecurityError` â†’ izin, `NotReadableError` â†’ kamera
meÅŸgul, `NotFoundError/OverconstrainedError` â†’ kamera yok, `AbortError` â†’ sessiz; AR mesajlarÄ±
gerÃ§ek nedene baÄŸlandÄ± (8 dil: `cameraBusy`/`cameraMissing`/`cameraStartFailed`).
`onError` ref'e taÅŸÄ±ndÄ± (dil deÄŸiÅŸimi kamerayÄ± yeniden baÅŸlatmÄ±yor); video `resize` dinleyicisi
yÃ¶n deÄŸiÅŸiminde akÄ±ÅŸ boyutlarÄ±nÄ± gÃ¼nceller (FOV taze); `play()` AbortError'Ä± artÄ±k sessiz.

### âœ… F2.7 SensÃ¶r yedeÄŸi â€” `useCompass.ts` â€” **KAPANDI (Faz 2 Ã¼Ã§Ã¼ncÃ¼ kod oturumu)**
Native sensÃ¶r `available=false`/start hatasÄ± â†’ **web `deviceorientation` yedeÄŸi** otomatik
baÄŸlanÄ±yor (iOS izin akÄ±ÅŸÄ±yla aynÄ± yol; fallback gerekiyorsa `webFallbackNeeded` efekti
dinleyicileri kurar). Durum metni: `not-supported`'da AR'da amber bilgi pil'i
(8 dil `approxCompass: "Pusula sensÃ¶rÃ¼ yok â€” yÃ¶n yaklaÅŸÄ±k"`). Guard'lar: `setNativeAccuracy`
/`setAbsoluteHeading` ref-guard'a alÄ±ndÄ± (60 Hz'de deÄŸiÅŸimsiz olaylar render etmiyor);
`markNativeUnavailable` tekrar denemelerde zaten aktif web yedeÄŸinin status'Ã¼nÃ¼ bozuyor
(flÄ±rke yok). GPS churn (Â§6.2): `snapCoordinatesForTracking` (~111 m snap) â€” native izleyici
artÄ±k her GPS fix'te yeniden kurulmuyor. Testler: `useCompass.test.ts` +3 (snap: yuvarlama/
sÄ±fÄ±r-gÃ¼rÃ¼ltÃ¼/NaN gÃ¼venliÄŸi). **Kalan: cihaz gÃ¼nÃ¼nde yedek yolun tek bakÄ±ÅŸta doÄŸrulanmasÄ±.**

### âœ… F2.8 Favori â†” radar-ok kopmasÄ± â€” `ARSkyMap.tsx`
Favori dokunuÅŸÃ¼ artÄ±k navigasyonu tetiklemiyor; detay kartÄ±nda ayrÄ± "hedefe rehberlik"
(`guideToTarget`) dÃ¼ÄŸmesi radar-ok iÃ§in tek yol.

**Ã‡Ä±kÄ±ÅŸ kriterleri:** Â§C.1/C.2/C.3/C.5 cihazda geÃ§er; F2.4 gerekiyorsa dÃ¼zeltme + altÄ±n test;
sahne tuÅŸlarÄ± gerÃ§ek Ã§izimleri cihazda deÄŸiÅŸtirir; F1.4/F1.2/F1.3 cihazda davranÄ±ÅŸ olarak teyidi.

---

## Faz 3 â€” Performans (tamamlandÄ± â€” kod tarafÄ± âœ…)

> Â§6. Ã–nce Ã¶lÃ§ (`recordPerformanceMetric`), sonra dÃ¼zelt; her maddede hedef metrik.
> **BeÅŸinci oturumda F3.1, F3.2, F3.4 ve F3.6; altÄ±ncÄ± oturumda F3.3 ve F3.5 kapandÄ±.**
> Cihaz tarafÄ±ndaki gÃ¶rÃ¼nÃ¼r doÄŸrulama (frame-rate hissi, worker console Ã§Ä±ktÄ±sÄ±) Â§C gÃ¼nÃ¼ne
> olur; kalanperformans izleme maddeleri Â§6.2 sonunda "izleme" olarak iÅŸaretlendi.

### âœ… F3.1 DakikalÄ±k worker dÃ¶ngÃ¼sÃ¼nÃ¼ durdur â€” `useObserverContext.ts` + `useTonightTargets.ts` â€” **KAPANDI (beÅŸinci kod oturumu)**
- Yeni `astronomyWorkerClient.ts`: modÃ¼l-kapsamÄ± lazy singleton worker; istekler id etiketli
  `postMessage`, yanÄ±tlar id ile yÃ¶nlendirilir (paylaÅŸÄ±mlÄ± worker'da Ã§akÄ±ÅŸma gÃ¼venli); worker
  hatasÄ± tÃ¼m bekleyen isteklere gider, Ã¶lÃ¼ Ã¶rnek dÃ¼ÅŸer, sonraki istek yeniden yaratmayÄ± dener;
  cancel closure'su geÃ§ yanÄ±t bÄ±rakmaz. `astronomy.worker.ts` id-echo protokolÃ¼ne geÃ§ti.
- `useTonightTargets` artÄ±k Worker doÄŸurmaz/Ã¶ldÃ¼rmez â€” yalnÄ±zca istek gÃ¶nderir; worker yoksa/
  hata varsa mevcut main-thread fallback korunur.
- `useObserverContext`: `isMinuteTickDue` kapÄ±sÄ± â€” tick yalnÄ±zca `visibilityState === 'visible'`
  ve dakika gerÃ§ekten deÄŸiÅŸince re-render; `visibilitychange`'de yetiÅŸtirir.
- Testler: `astronomyWorkerClient.test.ts` (+4: 10 tÃ¼ketici â‰¥1 worker, hata yÃ¶nlendirme,
  cancel, inÅŸa-baÅŸarÄ±sÄ±zlÄ±ÄŸÄ±) + `useObserverContext.test.ts` (+4: dakika flip, aynÄ± dakika,
  hidden skip, node-gÃ¼venlik).

### âœ… F3.2 SeÃ§icili maÄŸaza abonelikleri â€” **KAPANDI (beÅŸinci kod oturumu)**
`ObservationPlanner.tsx`, `ObservationSuitability.tsx`, `TodayDashboard.tsx`, `SkyHub.tsx`
seÃ§icisiz `useAppStore()`'dan tekil `useAppStore(state => â€¦)` aboneliklerine geÃ§ti; ilgisiz
maÄŸaza yazÄ±mlarÄ± bu sayfalarÄ± yeniden render etmiyor. (App.tsx kÃ¶k bileÅŸen â€” bÃ¼tÃ¼nsel abonelik
orada doÄŸal; diÄŸer kÃ¼Ã§Ã¼k bileÅŸenler izleme.)

### âœ… F3.3 AR kare-dÃ¶ngÃ¼sÃ¼ ayrÄ±lÄ±mlarÄ± â€” `ARSkyMap.tsx` â€” **KAPANDI (altÄ±ncÄ± kod oturumu)**
- `getContext('2d')` etkinlik-baÅŸÄ±na bir kez (kare-baÅŸÄ±na baktÄ± â†’ kurtuldu); `new Observer`
  + `MakeTime` yalnÄ±zca 1 Hz Ã¶nbellek penceresinde yeniden kurulur (radar/arama yollarÄ±
  Ã¶nbellekli Ã¶rnekleri kullanÄ±r), `celestialBodiesList` **modÃ¼l sabiti** (`CELESTIAL_BODIES`);
  `Object.values().filter().map()` zincirleri â†’ projeksiyon sÄ±rasÄ±nda beslenen **dÃ¼z
  listeler** (`projectedStarList`/`projectedDsoList`), etiket + crosshair + GPU dizileri
  bu listelerden okur; twinkle fazÄ± `starTwinklePhase(id)` ile **yÄ±ldÄ±z kimliÄŸinden**
  tÃ¼retilir â€” gÃ¶rÃ¼nÃ¼r kÃ¼me deÄŸiÅŸince faz kaymasÄ± yok (Â§4.5 kalan bulgusu kapandÄ±).
- Not: kare-baÅŸÄ±na `new Set` parÃ§asÄ± F3.4 ile kapalÄ±ydÄ± (`arGpuScene` `visibleBodyKeys`).
- Kalan: cihazda gÃ¶rsel teyit (Ã§erÃ§eve oranÄ±, twinkling kararÄ±) â€” Â§C referansÄ±.

### âœ… F3.4 GPU sahne dÃ¼zeltmeleri â€” `arGpuScene.ts` â€” **KAPANDI (beÅŸinci kod oturumu)**
- resize guard `Math.floor` ile hizalandÄ± â€” three.js iÃ§i `floor(width*ratio)` yazÄ±mÄ±yla eÅŸleÅŸir;
  kesirli CSS geniÅŸliÄŸinde kare-baÅŸÄ±na setSize/setPixelRatio bitti (test var).
- `dispose()` iÃ§inde `forceContextLoss()` â€” StrictMode Ã§ift-mount GL sÄ±zÄ±ntÄ±sÄ± kapandÄ± (test var).
- `updateBodies` kare-baÅŸÄ±na `new Set()` yerine yeniden-kullanÄ±lan `visibleBodyKeys` (test var).

### âœ… F3.5 Ana iÅŸ parÃ§acÄ±ÄŸÄ±ndaki gÃ¶k hesabÄ± worker'e â€” `AstroEventsHub.tsx`, `events.ts` â€” **KAPANDI (altÄ±ncÄ± kod oturumu)**
- Yeni `astroEventSearch.ts`: worker-safe ham matematik (%i18n iÃ§ermeyen) â€” 3 yÄ±llÄ±k GÃ¼neÅŸ/Ay
  tutulma aramasÄ± + 60 gÃ¼n Ã— 4 saat Ã— 5 gezegen sÃ¼pÃ¼rmesi seri-leÅŸtirilebilir satÄ±rlar dÃ¶ndÃ¼rÃ¼r
  (epoch ms + string enum'lar). `events.ts` yalnÄ±zca i18n biÃ§imlendirme katmanÄ± kaldÄ±
  (`formatAstroEventSearch`); davranÄ±ÅŸ aynÄ± (mevcut `events.test.ts` deÄŸiÅŸmedi).
- Astronomy worker'a `events` istek tipi eklendi (`id`-echo protokolÃ¼ korunur); paylaÅŸÄ±mlÄ±
  `astronomyWorkerClient`'a `requestAstroEventsFromWorker` eklendi (aynÄ± hata/cancel sÃ¶zleÅŸmesi).
- Yeni `useAstroEventsQuery`: react-query, **15 dk staleTime** + gÃ¼n-anahtarlÄ± Ã¶nbellek anahtarÄ±
  (`['astro-events', lang, tz, lat4, lng4, localDayKey]`) â€” AstroEventsHub dakika tik'inde
  katalog yeniden hesaplamÄ±yor; worker yoksa ana-thread yedeÄŸi aynÄ± eski davranÄ±ÅŸ.
- AstroEventsHub ayrÄ±ca F3.2 desenine geÃ§ti (seÃ§icili abonelikler); `upcomingEvents` artÄ±k
  yalnÄ±zca ucuz filtre/sÄ±ralama.
- Testler: `astroEventSearch.test.ts` (+5: pencere/sÄ±ra/eÅŸik invariyantlarÄ±, serileÅŸtirilebilir
  satÄ±rlar) + `astronomyWorkerClient.test.ts` +2 (events yÃ¶nlendirme, Ã¶lÃ¼-worker hata rota) = +7.

### âœ… F3.6 Basit kazanÄ±mlar Â· **KAPANDI (beÅŸinci kod oturumu)**
- `syncBackgroundAlerts`/`evaluateSmartNotifications` deps yuvarlanmÄ±ÅŸ koordinat anahtarÄ±nda
  (nesne kimliÄŸi â†’ gereksiz WorkManager Ã§aÄŸrÄ±sÄ± bitti); `useWeatherQuery` tek `.toFixed(4)`
  anahtar; APOD `loading="lazy" decoding="async"` + `getFallbackImages` useMemo;
  `Intl.DateTimeFormat` timezone Ã¶nbelleÄŸi (arPhotoGuide); `estimateBortleScale` memo.

---

## Faz 4 â€” Veri DoÄŸruluÄŸu (kalan: yalnÄ±zca Â§3.6 eÅŸik UI'si â†’ F6 kapsamÄ±na taÅŸÄ±ndÄ±)

### âœ… F4.1 Plan sekmesi matematiÄŸi â€” `ObservationPlanner.tsx` â€” **KAPANDI (Faz 4 dÃ¶rdÃ¼ncÃ¼ kod oturumu)**
- Yeni `plannerNightWindow.ts`: Ã¶rnek indeksleri gerÃ§ek unix zaman damgalarÄ±ndan tÃ¼retiyor â€”
  tek geÃ§iÅŸte `Map<localDayKey, indices>` gruplama (`groupHourlyIndicesByLocalDay`), gece
  penceresi (gÃ¼n â‰¥20:00 + ertesi â‰¤04:00), Ã§apa (21:00 yerel â†’ yoksa gÃ¼nÃ¼n ilk gerÃ§ek Ã¶rneÄŸi)
  ve gelecek-saat filtresi. `i * 24` varsayÄ±mÄ± ve boÅŸ-dizideki `new Date(NaN)` yolu silindi.
- "Bu Gece" ortalamasÄ± artÄ±k yalnÄ±zca henÃ¼z gelmemiÅŸ gece saatlerini kullanÄ±yor (geÃ§miÅŸ saatler puanÄ± Ã§arpÄ±tmÄ±yor).
- RÃ¼zgar/nem bilinmeyeni nÃ¶trleÅŸti: `observationScore` `ScoreInputs`'a `windKnown/humidityKnown`
  eklendi (bilinmeyen â†’ faktÃ¶r 50); 0 km/s='mÃ¼kemmel sakinlik' ÅŸiÅŸmesi bitti.
- Testler: `plannerNightWindow.test.ts` (TKS gruplama, gece penceresi, Ã§apa kÄ±rpÄ±k son gÃ¼n,
  DST-gÃ¼n dayanÄ±klÄ±lÄ±ÄŸÄ±, gelecek-filtre) + `observationScore.test.ts` nÃ¶tr rÃ¼zgar. (+9)

### âœ… F4.4 Servis katmanÄ± + alarm zamanlamalarÄ± â€” **KAPANDI (Faz 4 dÃ¶rdÃ¼ncÃ¼ kod oturumu)**
- Meteor alarm Ã§apasÄ±: 21:00 sabit yerine gerÃ§ek zirve anÄ± (12:00 yerel) â€” kÄ±sa lead'lerde
  artÄ±k zirveden sonra tetiklenemiyor (`alarmTiming.ts` `computeMeteorAlarmTrigger`; null =
  zirve geÃ§miÅŸ). +4 test (`alarmTiming.test.ts`).
- ISS "yÃ¼kseliÅŸ âˆ’ 15 dk" geÃ§miÅŸe dÃ¼ÅŸme: `computeIssAlarmTriggerMs` â€” yÃ¼kseliÅŸe 15 dk'dan
  yakÄ±nken tetik yÃ¼kseliÅŸ anÄ±na kelepÃ§elenir (kabasÃ¶nÃ¼ mesaj); tam geÃ§en geÃ§iÅŸ hÃ¢lÃ¢ hata yolu.
- Sessiz-saat: `scheduleNotification` artÄ±k `'quiet'` kanalÄ± dÃ¶ndÃ¼rÃ¼yor (ertelendi â†’ yalancÄ±
  "zamanÄ±nda kuruldu" baÅŸarÄ± mesajÄ± bitti; Meteor/ISS dÃ¼rÃ¼st `alarm.queuedQuiet`/kabasÃ¶nÃ¼ tost).
- `fetchJsonWithTimeout`: JSON gÃ¶vde okumasÄ± da aynÄ± timeout bÃ¼tÃ§esinde (tek AbortController);
  iss/weather/kp/geocoding/apod servislerine uygulandÄ± (+4 test).
- `issService`: ikinci (geniÅŸletilmiÅŸ visibleOnly=false) istek patlarsa taze birincil sonuÃ§
  korunuyor (boÅŸ liste = "gÃ¶rÃ¼nÃ¼r geÃ§iÅŸ yok" bilgisi) â€” eski Ã¶nbelleÄŸe dÃ¼ÅŸÃ¼ÅŸ yok (+1 test).
- TLE yaÅŸ rozeti: `getTleEpochMs` (YYDDD.FFFFF â†’ unix ms) + SatelliteTracker rozet
  (â‰¤72 sa yeÅŸil, Ã¶tesi amber; 8 dil title) (+2 test).
- smartNotifications clear-sky: **tek gÃ¼n/tek an basÄ±lÄ± push** â€” gÃ¼n anahtarlÄ± tek kayÄ±t;
  30 dk kayma penceresiyle +60 sn yeniden planlama dÃ¶ngÃ¼sÃ¼ bitti (yer deÄŸiÅŸimi veya â‰¥5 puan
  bulut iyileÅŸmesi hariÃ§) (+2 test).
- Â§3.4 web meteor Ã§anÄ±: web toggle artÄ±k sessiz Ã§Ä±kmÄ±yor â€” Web Audio kÄ±sa Ã§an
  (`webBell.ts`) + `alarm.webOnly` mesajÄ± (8 dil, `alarmTimingMessages` flat katmanÄ±).
- Gelecek-yÄ±l Ã¶n-gÃ¶zÃ¼: son zirve geÃ§ince ilk 3 gelecek-yÄ±l gÃ¶sterisi yÄ±l rozetiyle listeleniyor
  (alarm kurulumu da Ã§alÄ±ÅŸÄ±yor).
- AuroraForecast Kp eÅŸikleri `kpThresholds.ts` tek modÃ¼le (isHigh/isModerate/gradient +
  `featureStorage` varsayÄ±lanÄ±).
- **Kalan:** Â§3.6 bildirim eÅŸik ayar UI'si â†’ Faz 6/7 kapsam notu.

### âœ… F4.2 Stale UI durumlarÄ± â€” **KAPANDI (Faz 4 kod oturumu)**
- HourlyCloudChart / TonightTimeline hovered/selected index data-identity ile sÄ±fÄ±rlanÄ±r (`useEffect` + prop kimlik).
- TonightTargets eski konum listede kaybolur, skeleton altÄ±nda kalÄ±r (`!targetsLoading` guard'lÄ± liste).
- ObservationSuitability Enter'Ä±n eski sonucu koyan sÃ¶zdeki yarÄ±ÅŸ dÃ¼zeltildi: `resultsForQueryRef` tag'i â€” sonuÃ§lar gÃ¼ncel sorguya aidiyet etmiyor/arama yolda ise Enter yoksayÄ±lÄ±r.

### âœ… F4.3 ISS iz matematiÄŸi â€” `ISSTracker.tsx` â€” **KAPANDI (Faz 4 kod oturumu)**
- Yeni `groundTrack.ts`: gerÃ§ek dairesel-yÃ¶rÃ¼nge zemin-iz iliÅŸkisi `Ï† = asin(sin iÂ·sin u)` +
  ters kuadrant-dÃ¼zgÃ¼n `u(dÎ»)`; dÃ¼ÄŸÃ¼m boylamÄ± aynÄ± iliÅŸki Ã¼zerinden mevcut konumdan Ã§Ã¶zÃ¼lÃ¼r
  (eÄŸri iÅŸaretÃ§iye tam oturur, API staleness'a baÄŸÄ±ÅŸÄ±k; TLE-raan yoluyla matematiksel eÅŸdeÄŸer).
- `ISSTracker.tsx` eski `iÂ·sin(Î”Î»)` doÄŸrusal-genlik yaklaÅŸÄ±mÄ±ndan Ã§Ä±karÄ±ldÄ± (~6,6Â° sapma).
- Test: `groundTrack.test.ts` (+6) â€” baÄŸÄ±msÄ±z el-hesabÄ± altÄ±n eÄŸri (Â±0,05Â°), parametrik
  referansa Â±0,5Â° tam eÅŸlik (audit toleransÄ±), kuzey/gÃ¼ney dal Ã§apa + tepe noktasÄ± testleri.

### âœ… F4.5 App.tsx hata mesajÄ± kanallarÄ± â€” **KAPANDI (Faz 4 kod oturumu)**
- Ã–lÃ¼ 'FETCH_FAILED' dalÄ± kaldÄ±rÄ±ldÄ±; `weatherErrors.ts` classifier: offline / timeout
  (FetchTimeoutError) / server (5xx + 429 + ApiContractError) / unknown (4xx).
- Mesajlar `i18n.ts`'e flat `weatherStatusMessages` katmanÄ± olarak eklendi (8 dil Ã— 4 kanal,
  `locationMessages` deseni); App.tsx 11 satÄ±r inline Record yerine tek satÄ±r kanal-anahtarÄ±.

---

## Faz 5 â€” Depolama, Navigasyon, i18n, A11y (hedef: 1 hafta)

### âœ… F5.1 Persist gÃ¶Ã§Ã¼ â€” `useAppStore.ts` â€” **KAPANDI (Faz 2 oturumu)**
- `version: 1` + `migratePersistedAppState` (beyaz liste + lang/Tab/LocationData/locationSource doÄŸrulama); `merge` aynÄ± beyaz listeyi uygular; +5 test.
- Kalan: `storageRepository` diagnostics â†’ F5.2.

### âœ… F5.2 storageRepository diagnostics â€” **KAPANDI (Faz 5 yedinci kod oturumu)**
- storageRepository, diagnostics modÃ¼lÃ¼nÃ¼ **import etmeden** (dairesel baÄŸÄ±mlÄ±lÄ±ÄŸÄ± kÄ±rmak
  iÃ§in) `setStorageDiagnosticsListener` kancasÄ±nÄ± yayÄ±mlÄ±yor; `diagnostics.ts`'e yeni
  `installStorageDiagnostics()` ile baÄŸlanÄ±yor (mevcut `installGlobalObservability` akÄ±ÅŸÄ±na
  dahil, cleanup'ta sÃ¶kÃ¼lÃ¼r).
- KapatÄ±lan dÃ¼ÅŸÃ¼ÅŸler: **bozuk JSON** (`getJson` â†’ `json-parse-failed`; self-healing
  davranÄ±ÅŸÄ± korunur), **native init dÃ¼ÅŸÃ¼ÅŸÃ¼** (`native-init-failed`), **web yazma hatasÄ±**
  (`write-failed`), **native yazma sonrasÄ± bitiÅŸ** (`native-write-failed`, rollback kaydÄ±).
- Self-echo guard: diagnostics almanaÄŸÄ± anahtarÄ± (`skyview_diagnostics_v1`) kendi dÃ¼ÅŸÃ¼ÅŸÃ¼nÃ¼
  kaydetmez â€” `recordDiagnostic`'Ä±n kendi yazÄ±mÄ± dÃ¼ÅŸerse sonsuz Ã¶zyineleme imkÃ¢nsÄ±z.
- Testler: `storageRepository.test.ts` (5 dÃ¼ÅŸÃ¼ÅŸ + 4 yaÅŸam dÃ¶ngÃ¼sÃ¼: localStorageâ†’native gÃ¶Ã§,
  FIFO yazma kuyruÄŸu, `flush()` tahliye-bekliyor, `keys()` Ã¶n-ek) + `diagnostics.test.ts`
  (almanaÄŸa yazÄ±m + self-echo) = **+11 test**.
- **DÃ¼rÃ¼stlÃ¼k kaydÄ±:** oturumda eski `storageRepository.test.ts` Ã¼zerine yazÄ±ldÄ±; Ã¶nceki
  dosyanÄ±n 3 testlik kapsamÄ± (yazma kuyruÄŸu/yaÅŸam dÃ¶ngÃ¼sÃ¼) yeniden ve daha geniÅŸ olarak
  inÅŸa edildi â€” net test sayÄ±sÄ± yine arttÄ± (173â†’185).

### F5.3 DonanÄ±m geri tuÅŸu modal kaydÄ± â€” `App.tsx:111-121` Â· M
- useBackHandlerBridge / registerModalForBack; kalibrasyon, foto kÄ±lavuzu, gÃ¼nlÃ¼k & BehindDetail; `CelestialObjectDetail planned`.

### F5.4 Standart Modal/BottomSheet ( = F6.2 ) Â· L
- focus triade (`useFocusTrap` latest-ref), ESC, aria-modal, RTL, background kaydÄ±rma kilidi; AnimatePresence>Suspense Ã§Ä±kÄ±ÅŸ animasyonu buraya taÅŸÄ±nÄ±r.
- APOD lightbox / gÃ¶k cismi detay / gÃ¼nlÃ¼k modal **bu bileÅŸene** taÅŸÄ±nÄ±r.

### âœ… F5.5 Leaflet saÄŸlamlÄ±k â€” `LightPollutionMap.tsx` â€” **KAPANDI (Faz 5 yedinci kod oturumu)**
- **ResizeObserver â†’ `invalidateSize()`**: container boyutlarÄ± pencere-resize olmadan deÄŸiÅŸir
  (telefon dÃ¶nÃ¼ÅŸÃ¼ Â§C.8, mount animasyonu); ResizeObserver yoksa (eski WebView) sessiz atlanÄ±r.
- **UÃ§uÅŸ-yarÄ±ÅŸÄ± guard'larÄ±**: modal uÃ§uÅŸ sÄ±rasÄ±nda kapatÄ±labilir (GPS konum onayÄ±, zaman-dilimi
  Ã§Ã¶zÃ¼mÃ¼, arama debounce'u beklerken unmount) â†’ `isMountedRef` ile `setSelectedCoords`/
  `setSelectionLoading`/`setGpsLoading`/`setSearchLoading` ve `onLocationSelect+onClose`
  yalnÄ±zca mount edilmiÅŸken Ã§alÄ±ÅŸÄ±r (kapat-sonra-seÃ§ yarÄ±ÅŸÄ± sona erdi).
- **Arama ikonu** karar: otomatik debounce'lu arama Ã§alÄ±ÅŸtÄ±ÄŸÄ± iÃ§in ikon bir eylem dÃ¼ÄŸmesine
  Ã§evrilmedi (sahte affordance Ã¼retir); dekoratif `aria-hidden` + input'a `aria-label`
  (`obs.searchPlaceholder`) â€” asÄ±l a11y boÅŸluÄŸu olan etiketsiz input Ã§Ã¶zÃ¼ldÃ¼.

### âœ… F5.6 i18n saÄŸlamlÄ±k â€” **KAPANDI (Faz 5 yedinci kod oturumu)**
- **Parite testleri**: ana katalog (8 dil) anahtar-yolu kÃ¼mesi birebir + `i18nExtra` flat
  katmanÄ± anahtar/boÅŸ-olmayan-deÄŸer paritesi (`i18nIntegrity.test.ts` +2 test; ana katalog
  aÄŸaÃ§-yolu dÃ¼zleÅŸtirmesi `flattenKeys`).
- **Pusula kÄ±saltmalarÄ± katalog**: worker-safe `utils/compass.ts` (kanonik Nâ€¦NW kodlarÄ± +
  `compassIndexForAzimuth` + `canonicalCompassCode`, saf hesap) + ana-thread
  `utils/compassLabels.ts` (`localizeCompassCode`/`getCompassLabels`/`getCompassDirection`)
  + `i18nExtra.ts`'e `compass.*` 8 anahtar Ã— 8 dil. Veri katmanÄ± kanonik kodlarÄ± taÅŸmaya
  devam eder; gÃ¶rÃ¼ntÃ¼de Ã§Ã¶zÃ¼lÃ¼r: CelestialObjectDetail, TonightTargets, ARSkyMap canvas
  pusula harfleri (`langRef`), LightPollutionMap koordinat sonekleri (N/S/E/W), astronomy.ts
  Ã¼Ã§ dizin yerine tek kaynaÄŸa baÄŸlandÄ±.
- **`getMoonPhase` lang yolu**: ARSkyMap iki Ã§aÄŸrÄ± artÄ±k `langRef.current` geÃ§iriyor
  (Ã§izim yalnÄ±zca fraction/isWaxing kullanÄ±r; davranÄ±ÅŸ korumalÄ±) + `astronomy.test.ts`
  regresyon testi (en/tr etiket; anahtar sÄ±zÄ±ntÄ±sÄ± yolu kapalÄ±).

### âœ… F5.7 A11y hÄ±z kazanÃ§larÄ± â€” **KAPANDI (Faz 5 yedinci kod oturumu)**
- `aria-label`: LPM GPS FAB (`lpm2.goToLocation`), LPM kapat (`common.close` â€” mevcut anahtar),
  ObservationSuitability arama input + submit dÃ¼ÄŸmesi (`obs.searchBtn`), ARSkyMap zaman
  yolculuÄŸu slider'Ä± (`timeTravel`), ARSkyMap aram modalÄ± input'u, MoonPhaseCalendar slider'Ä±
  (`moonSlider.title`), LPM opaklÄ±k slider'Ä± (`lightPollutionMap.opacity`) â€” hepsi mevcut
  anahtarlarla (sÄ±fÄ±r yeni arama/anÄ±htarÄ± ekle).
- **HTML Ã§ubuklarÄ±na klavye eriÅŸimi**: HourlyCloudChart sÃ¼tunlarÄ± `div`â†’gerÃ§ek `button`;
  klavye odaÄŸÄ± `(onFocus/onBlur)` hover ile aynÄ± detay panelini aÃ§ar, `aria-pressed` + her
  Ã§ubukta geliÅŸmiÅŸ okunur ad (`saat â€” Bulut %X`).
- Not: Â§5 tablosunda `ARSkyMap useFocusTrap` satÄ±rÄ± F5.4 kapsam; LPM `AnimatePresence`
  satÄ±rÄ± F5.4/F6.2 kapsam.

---

## Faz 6 â€” UI Modernizasyon (1,5-2 hafta, kademeli)

| ID | Tema | Efor |
| F6.1 | Token konsolidasyonu: 6+ LV. koyu tonu â†’ `--sv-*` (theme-color/splash/styles alignment) | M |
| F6.2 | Standart Modal/Toast (F5.4 ile) | L |
| F6.3 | Mono-sayÄ± + tip Ã¶lÃ§eÄŸi | S |
| F6.4 | AR HUD ÅŸeridi (FOV/azimut/kalite cam-pill) | M |
| F6.5 | GÃ¼n Ã¶zeti hero | M |
| F6.6 | BoÅŸ durum komponenti | S |
| F6.7 | count-up + reduced-motion | S |
| F6.8 | Haptic sÃ¶z varlÄ±ÄŸÄ± | S |
| F6.9 | Pull-to-refresh hava | S |
| F6.10 | Meteor geri sayÄ±m + takvim bugÃ¼n | S |

---

## BaÄŸÄ±mlÄ±lÄ±klar ve SÄ±ra (gÃ¼ncel)

```
Faz 2 (kalan: yalnÄ±zca cihaz gÃ¼nÃ¼ Â§C + F2.4 gerekirse iÅŸaret dÃ¼zeltmesi) â”€â–¶ Faz 5 â”€â–¶ Faz 6
        â”‚
        â–¼ Faz 3 kod tamam âœ”  Â·  Faz 4 kod tamam âœ” (yalnÄ±zca Â§3.6 eÅŸik UI'si F6'ya taÅŸÄ±ndÄ±)
```

- F5.1 kapandÄ± (Kod Faz 2 ilk oturumda) â†’ persist aciliyeti dÃ¼ÅŸtÃ¼.
- F1.3 tamam â†’ F4.1 TZ Ã¶n-koÅŸulu dÃ¼ÅŸtÃ¼.
- F2.4 yalnÄ±zca cihaz gÃ¼nÃ¼.
- F2.7 kapandÄ± (Ã¼Ã§Ã¼ncÃ¼ kod oturumu) â†’ **Faz 2'nin kod iÅŸi tamamen bitti**; kalan tek iÅŸ cihaz gÃ¼nÃ¼.
- F4.3/F4.5/F4.2 kapandÄ± (Ã¼Ã§Ã¼ncÃ¼ kod oturumu); **F4.1/F4.4 kapandÄ± (dÃ¶rdÃ¼ncÃ¼ kod oturumu) â†’ Faz 4'Ã¼n kod tarafÄ± bitti**.
- **F3.1/F3.2/F3.4/F3.6 kapandÄ± (beÅŸinci kod oturumu)**.
- **F3.3/F3.5 kapandÄ± (altÄ±ncÄ± kod oturumu) â†’ Faz 3'Ã¼n kod tarafÄ± bitti.**
- **F5.2/F5.5/F5.7/F5.6 kapandÄ± (yedinci kod oturumu) â†’ Faz 5'te kalan yalnÄ±zca F5.3 + F5.4 (modal ailesi); cihaz iÅŸi: Â§C.**
- F5.4 = F6.2 tek kurulum.

| Faz | SÃ¼re | Ana kazanÄ±m |
| 2 | kalan: cihaz gÃ¼nÃ¼ | Sahne tuÅŸlarÄ± cihazda teyit + projeksiyon |
| 3 | âœ” tamamlandÄ± | Worker/eÄŸikler/GPU + AR kare-dÃ¶ngÃ¼sÃ¼ + astro hesabÄ± worker'da |
| 4 | kalan: Â§3.6 eÅŸik UI (F6'ya taÅŸÄ±ndÄ±) | Plan matematiÄŸi âœ”, alarmlar âœ” (ISS izi âœ”) |
| 5 | kalan: F5.3+F5.4 (modal ailesi) | Storage diagnostics âœ”, i18n parite âœ”, a11y âœ”, Leaflet âœ” |
| 6 | 1,5-2 h | Tek Modal/Toast + gÃ¶rsel sistem |

**Kalan: ~2-2,5 hafta** (Faz 2/3/4 kod tarafÄ± bitti; Faz 5'te modal ailesi + Faz 6 ve cihaz gÃ¼nÃ¼).

---

## TAMAMLANAN FAZLAR (2026-10-17)

- **Faz 0:** F0.1 gerÃ§ek dist/mag (1 Hz cache Equator().dist + Illumination().mag) + TS2739 + Â§3.3 kart; F0.2/F0.3 Ã¶lÃ¼ler + F2.1 iskeleti; F0.4 CSP prod-only (`inject-production-csp`); F0.5 mojibake; .eslintrc ignorePatterns
- **Faz 1:** F1.1 ISS dÃ¶ngÃ¼+stale+cooldown (+3 test); F1.2 wake lock release; F1.3 locationSource persist + Ã§ip (8 dil `locationMessages`) + 2 GPS TZ; F1.4 preserveDrawingBuffer + cover; F1.5 APOD fetchError+retry+date+http schema; F1.6 NASA anahtar + .env.example; F1.7 splash + bootstrap kartÄ± + getLaunchUrl
- **Faz 2 (kod oturumu):** F2.1 katman anahtarlarÄ± + ekliptik/gÃ¶ksel ekvator (`arSkyGuides.ts` + GPU `guideLines` katmanÄ± + halka testleri); F2.2 fieldMode kÄ±zÄ±l-vizyon + AR'da app-overlay yumuÅŸatma (index.css); F2.5 zaman-yolculuÄŸu Ã¶nbellek appendi; F2.6 kamera hata sÄ±nÄ±flandÄ±rmasÄ± + onError ref + stream resize + play abort triaj (+5 test); F2.8 favori/rehberlik ayrÄ±mÄ±; F2.4 kod parÃ§asÄ± (screen.orientation standard + zd guard teyidi); **F5.1 persist version+migrate (beyaz liste, +5 test)**
- **ÃœÃ§Ã¼ncÃ¼ kod oturumu:** F2.7 sensÃ¶r yedeÄŸi (web `deviceorientation` fallback + approxCompass 8 dil + Â±60 Hz guard + ~111 m GPS snap, +3 test); **F4.3** ISS zemin-izi (`groundTrack.ts` gerÃ§ek `asin(sin iÂ·sin u)` iliÅŸkisi + altÄ±n eÄŸri testleri, +6 test); **F4.5** hata kanallarÄ± (`weatherErrors.ts` classifier + `weatherStatusMessages` 8 dil, Ã¶lÃ¼ FETCH_FAILED dali kaldÄ±rÄ±ldÄ±, +5 test); **F4.2** stale UI (chart/timeline index reset + TonightTargets skeleton + Enter yarÄ±ÅŸÄ± tag-guard'Ä±)
- **DÃ¶rdÃ¼ncÃ¼ kod oturumu:** **F4.1** plan matematiÄŸi (`plannerNightWindow.ts` gerÃ§ek zaman-damgalarÄ±ndan grup/gece-penceresi/Ã§apa/gelecek-filtre; `i*24` + NaN yolu silindi; bu-gece ortalamasÄ±na geÃ§miÅŸ-saat filtresi; `observationScore` `windKnown/humidityKnown` nÃ¶tr faktÃ¶r, +9 test); **F4.4** alarm & servis paketi (`alarmTiming.ts` meteor gerÃ§ek-zirve Ã§apasÄ± + ISS kelepÃ§eli tetik, +7 test; `notifications.ts` `'quiet'` kanalÄ± + dÃ¼rÃ¼st tostlar, +1 test; `fetchJsonWithTimeout` gÃ¶vde-okuma aynÄ± bÃ¼tÃ§ede ve 5 servise uygulandÄ±, +4 test; `issService` taze-birincil korunumu, +1 test; `getTleEpochMs` + SatelliteTracker TLE yaÅŸ rozeti, +2 test; clear-sky tek gÃ¼n/tek an push, +2 test; Â§3.4 web Ã§anÄ± `webBell.ts` + `alarm.webOnly`; gelecek-yÄ±l Ã¶n-gÃ¶zÃ¼; `kpThresholds.ts` tek Kp eÅŸik modÃ¼lÃ¼). AyrÄ±ca cihaz-baÄŸÄ±msÄ±z: `arSkyGuides.ts` astronomy-engine `Vector(time)` imza uyumu (tsc bloker). Â§3.6 eÅŸik UI'si bilinÃ§li olarak Faz 6'ya taÅŸÄ±ndÄ±.
- **BeÅŸinci kod oturumu (Faz 3):** **F3.1** worker churn (`astronomyWorkerClient.ts` lazy singleton + istek-id yÃ¶nlendirme + hata/cancel gÃ¼venliÄŸi; `astronomy.worker.ts` id-echo; `useTonightTargets` Worker doÄŸurmuyor; `useObserverContext` `isMinuteTickDue` gÃ¶rÃ¼nÃ¼r-dakika kapÄ±sÄ±, +8 test); **F3.2** seÃ§icili abonelikler (ObservationPlanner/ObservationSuitability/TodayDashboard/SkyHub); **F3.4** GPU dÃ¼zeltmeleri (`arGpuScene` resize `Math.floor` guard + `dispose` `forceContextLoss` + yeniden-kullanÄ±lan `visibleBodyKeys`, +3 test); **F3.6** basit kazanÄ±mlar (App WorkManager yuvarlanmÄ±ÅŸ koordinat anahtarÄ± Ã—2 efekt; `useWeatherQuery` tek yuvarlanmÄ±ÅŸ anahtar; NASAAPOD lazy img + `fallbackImages` memo; `arPhotoGuide` timezone Ã¶nbellekli saat-biÃ§imlendirici; `estimateBortleScale` 256 giriÅŸli memo).
- **AltÄ±ncÄ± kod oturumu (Faz 3 kapanÄ±ÅŸÄ±):** **F3.5** astro hesabÄ± worker'da (yeni `astroEventSearch.ts` worker-safe ham matematik: 3 yÄ±llÄ±k tutulma aramasÄ± + 60 gÃ¼n gezegen sÃ¼pÃ¼rmesi seri satÄ±rlar; `astronomy.worker.ts` + `events` istek tipi; `astronomyWorkerClient` + `requestAstroEventsFromWorker` (id yÃ¶nlendirme + hata/cancel korundu); yeni `useAstroEventsQuery` 15 dk staleTime + gÃ¼n-anahtarlÄ± anahtar + worker-yok/ana-thread yedeÄŸi; AstroEventsHub seÃ§icili aboneliklere geÃ§ti, dakika tik'i yalnÄ±zca ucuz filtre, +7 test); **F3.3** AR kare-dÃ¶ngÃ¼sÃ¼ (`getContext('2d')` etkinlik-baÅŸÄ±na; `Observer`/`MakeTime` 1 Hz penceresinde, radar yollarÄ± Ã¶nbellekli Ã¶rnekleri kullanÄ±r; `CELESTIAL_BODIES` modÃ¼l sabiti; `Object.values()` zincirleri â†’ `projectedStarList`/`projectedDsoList` dÃ¼z listeleri (etiketler + crosshair + GPU beslemesi); twinkle fazÄ± `starTwinklePhase(id)` kimlik-tÃ¼revli â€” gÃ¶rÃ¼nÃ¼r kÃ¼me deÄŸiÅŸiminde faz kaymasÄ± yok, Â§4.5 kalan bulgusu kapandÄ±).
- **Yedinci kod oturumu (Faz 5 ilk paket):** **F5.2** storage diagnostics (`setStorageDiagnosticsListener` kancasÄ± + `installStorageDiagnostics` kablosu; `json-parse-failed`/`native-init-failed`/`write-failed`/`native-write-failed` kayÄ±tlarÄ±; `skyview_diagnostics_v1` self-echo guard, +11 test); **F5.5** Leaflet saÄŸlamlÄ±k (ResizeObserverâ†’`invalidateSize` â€” dÃ¶nÃ¼ÅŸ Â§C.8; `isMountedRef` uÃ§uÅŸ-yarÄ±ÅŸÄ± guard'larÄ± GPS/arama/zaman-dilimi yollarÄ±nda; arama ikonu `aria-hidden` dekoratif + input `aria-label` â€” butonsuz karar dokÃ¼mante); **F5.7** a11y (GPS FAB + harita kapat `aria-label`; HourlyCloudChart Ã§ubuklarÄ± `div`â†’`button` klavye-odak paritesi + `aria-pressed` + okunur ad; suitability arama input+submit, AR zaman-yolculuÄŸu+arama input, MoonPhaseCalendar + LPM opaklÄ±k slider'larÄ± â€” hepsi mevcut anahtarlarla); **F5.6** i18n (ana katalog + i18nExtra 8 dil parite testleri; worker-safe `utils/compass.ts` + `utils/compassLabels.ts` + `compass.*` 8 dil katmanÄ±; gÃ¶rÃ¼ntÃ¼ noktalarÄ± yerelleÅŸtirildi: gÃ¶k cismi detay, TonightTargets, AR canvas pusula harfleri, LPM koordinat sonekleri; `getMoonPhase` ARSkyMap lang yolu + regresyon testi).
- **Sekizinci kod oturumu (Faz 5 kapanışı):** **F5.4** StandardModal/BottomSheet (yeni `ui/Modal.tsx`: center/sheet/fullscreen/lightbox; CSS keyframe `svModal*` — `motion` Modal zincirinden çıkarıldı: chunk 147→18.7 kB; `useFocusTrap` → `attachFocusTrap` çekirdek + latest-ref; `modalScrollLock` sayaçlı kilit) + 6 ekran migrasyonu (ARSkyMap arama+kalibrasyon; NASAAPOD lightbox; CelestialObjectDetail fullscreen + `planned` taze-okuma + `OBSERVATION_DATA_CHANGED` reaktif; günlük ekle formu BottomSheet; LPM hep-bağlı StandardModal — `AnimatePresence>Suspense` çıkış kırılması bitti); **F5.3** LIFO geri tuşu registry (`backButtonRegistry.ts` + `consumeBackButtonModal` pop semantiği; `App.tsx` DOM-id hack silindi); `useModalBackHandler` (foto kılavuzu + zaman-yolculuğu kayıtlı); tuzak-zamanlama hatası (koşullu render'da `RefObject.current` ilk koşuda null) callback-ref deseniyle çözüldü ve tarayıcıda doğrulandı (+12 test: registry 4 + scrollLock 3 + focusTrap 5); iki önceden var olan tsc hatası onarıldı (`storageRepository.test.ts` vitest-4 `vi.fn` imzası, `LightPollutionMap.tsx` `L.map` guard-değişkeni).
- **QA (güncel, sekiz oturum):** lint 0/0 · tsc 0 · test **46 dosya / 197 test** yeşil · build ✔ (three-vendor >500 kB bilinen uyarı)

---

## Â§C â€” CÄ°HAZ TESTÄ° (gÃ¼ncel)

| ID | Senaryo | BaÄŸlÄ± iÅŸ |
| C.1 | AR screenshot tam katman (GPU yÄ±ldÄ±z/gezegen + video kÄ±rpmasÄ±) | F1.4 kod ok â†’ **cihazda doÄŸrula** |
| C.2 | Ankara elle seÃ§ â†’ restart â†’ onay Ã§ipi; manuel korunur | F1.3 â†’ doÄŸrula |
| C.3 | Saha modu ekran kilidi dÃ¶nÃ¼ÅŸÃ¼ | F1.2 â†’ doÄŸrula |
| C.4 | AR'da Ä°ngilizce â†’ kamera dÃ¼ÅŸmÃ¼yor (F2.6 sonrasÄ± doÄŸrula) | F2.6 |
| C.5 | Kuzey/doÄŸu yÄ±ldÄ±z yÃ¶nÃ¼ | F2.4 ÅART |
| C.6 | ArapÃ§a AR pusula/etiket | F5.6 |
| C.7 | Arka plan 1 saat â†’ WorkManager | F4.4 |
| C.8 | DÃ¶ndÃ¼rÃ¼lmÃ¼ÅŸ telefon + light pollution haritasÄ± | F5.5 |
| C.9 | ISS geÃ§iÅŸ ~15 dk alarm edge | F4.4 |
| C.10 | Sahne kontrolleri: Izgara/Ekliptik/GÃ¶ksel Ekvator gerÃ§ekten Ã§izimleri deÄŸiÅŸtiriyor; gece modunda AR aÃ§Ä±kken Ã§ift kÄ±zÄ±l yok | F2.1 + F2.2 (yeni) |
| C.11 | Modal açıkken (kalibrasyon/günlük/detay/LPM) donanım geri tuşu → yalnızca en üst modal kapanır (LIFO pop), ikinci basış sekme davranışına döner; çıkış animasyonu sırasında ikinci basış güvenli | F5.3+F5.4 kod ok → **cihazda doğrula** |

---

## NOT
- `AUDIT_REPORT.md`, plan dokÃ¼manÄ±ndaki 14 maddelik edit planÄ±na gÃ¶re 2026-10-17'de gÃ¼ncellendi (Durum gÃ¼ncellemesi + Â§1 tablo + Â§2 yenileme + Ã§Ã¶zÃ¼len bulgu iÅŸaretleri + yeni Â§9 + yeni Â§10).
- DÃ¶rdÃ¼ncÃ¼ kod oturumu sonrasÄ± ikili senkron: ROADMAP "DÃ¶rdÃ¼ncÃ¼ dÃ¼zeltme turu" blok notu + F4.1/F4.4 âœ… giriÅŸleri + QA baseline (40/155) â†” AUDIT "dÃ¶rdÃ¼ncÃ¼ kod oturumu" banner'Ä± + Â§3.4/Â§4.6/Â§4.9/Â§4.11 iÅŸaretleri + Â§5 tablo satÄ±rÄ± + Â§9 liste + Â§10 yeni grup. Â§3.6 bilinÃ§li olarak Faz 6'ya taÅŸÄ±ndÄ± (yalnÄ±zca ROADMAP segmentti).
- BeÅŸinci kod oturumu sonrasÄ± ikili senkron: ROADMAP "BeÅŸinci dÃ¼zeltme turu" blok notu + Faz 3 bÃ¶lÃ¼mÃ¼ yeniden yazÄ±mÄ± (F3.1/F3.2/F3.4/F3.6 âœ…, F3.3/F3.5 aÃ§Ä±k) + baÄŸÄ±mlÄ±lÄ±k/sÄ±ra tablosu + QA baseline (42/166) + Tamamlanan Fazlar beÅŸinci grup â†” AUDIT "beÅŸinci kod oturumu" banner'Ä± + Â§1 tablo + Â§6.1/Â§6.2/Â§7 iÅŸaretleri + Â§9 liste + Â§10 yeni grup.
- AltÄ±ncÄ± kod oturumu sonrasÄ± ikili senkron: ROADMAP "AltÄ±ncÄ± dÃ¼zeltme turu" blok notu + Faz 3 bÃ¶lÃ¼mÃ¼ tamamlandÄ± (F3.3/F3.5 âœ…) + baÄŸÄ±mlÄ±lÄ±k/sÄ±ra tablosu (Faz 3 âœ”, kalan ~2,5-3 hafta) + QA baseline (43/173) + Tamamlanan Fazlar altÄ±ncÄ± grup â†” AUDIT "altÄ±ncÄ± kod oturumu" banner'Ä± + Â§1 tablo + Â§4.5 twinkle + Â§6.1 GPU maddesi + Â§6.2 astro hesabÄ± maddesi iÅŸaretleri + Â§9 liste (F3.3/F3.5 satÄ±rlarÄ± kalktÄ±) + Â§10 yeni grup.
- Yedinci kod oturumu sonrasÄ± ikili senkron: ROADMAP "Yedinci dÃ¼zeltme turu" blok notu + Faz 5 bÃ¶lÃ¼mÃ¼ (F5.2/F5.5/F5.6/F5.7 âœ…, F5.3/F5.4 aÃ§Ä±k) + baÄŸÄ±mlÄ±lÄ±k/sÄ±ra tablosu (kalan ~2-2,5 hafta) + QA baseline (43/185) + Tamamlanan Fazlar yedinci grup â†” AUDIT "yedinci kod oturumu" banner'Ä± + Â§1 tablo + Â§5 tablo iki satÄ±rÄ± (LPM div ikon + unmount setState) + Â§7 storage iÅŸaretleri + Â§9 liste + Â§10 yeni grup. C.6/C.8 cihaz senaryolarÄ± artÄ±k kod-tarafÄ± hazÄ±r (yine cihazda doÄŸrulama ÅŸart).
- Sekizinci kod oturumu sonrası ikili senkron: ROADMAP başlık notu (Faz 5 TAMAM, yalnızca Faz 6 kalan) + Faz 5 bölümü tamamlandı özeti (F5.3/F5.4 ✔ + kabul/varsayım kayıtları: "BehindDetail"→CelestialObjectDetail, zaman-yolculuğu ek `useModalBackHandler` kaydı, LPM lazy ilk-odak kabulü) + F6.2 satırı "tabanı hazır, Toast kalan" + §C.11 satırı + Kalıcı Kurallar'a modal kural bloğu + QA baseline (46/197) + Tamamlananlar F5.3/F5.4 satırları ⇔ AUDIT banner + §1 tablo + §5 üç satır işaretleri + §6 Modal chunk maddesi + §9 liste (satır 2 kapandı, C.11 eklendi) + §10 yeni grup + dürüstlük kaydı genişletildi (önceden var olan iki tsc hatası onarıldı).


---
---
# ARŞİV BÖLÜMÜ 2 — AUDIT_REPORT.md (sıkıştırma öncesi tam içerik)
# SkyView â€” KapsamlÄ± Kod & Hata Denetim Raporu

> Denetim tarihi: 2026-10-17 Â· Dal/dizin: `skyview_v3_new/skyview` (v5.0.0)
> Kapsam: `src/` altÄ±nda 104 kaynak dosyasÄ± (~15.300 satÄ±r) + `android/` + Capacitor yapÄ±landÄ±rmasÄ±
> YÃ¶ntem: `tsc --noEmit`, ESLint, vitest (98 test), canlÄ± API doÄŸrulamasÄ± (Open-Meteo `unixtime` davranÄ±ÅŸÄ±) ve altÄ± alt alan Ã¼zerinde paralel birebir kod incelemesi.
> Denetim sÄ±rasÄ±nda **hiÃ§bir kaynak dosyada deÄŸiÅŸiklik yapÄ±lmadÄ±dÄ±r.** Bu rapor ve `ROADMAP.md` harici dokÃ¼mandÄ±r.

> **DURUM GÃœNCELLEMESÄ° (2026-10-17, Faz 0â€“1 + Faz 2 kod iÅŸleri):** Â§3.1, Â§3.2, Â§3.3, Â§3.7 (Ã§oÄŸu), Â§4.1, Â§4.2, Â§4.3, Â§4.4, Â§4.7, Â§4.8, Â§4.9 kÄ±smen, Â§4.11-TZ giderildi. Faz 2'den F2.1 (katman toggle'larÄ± + ekliptik/gÃ¶ksel ekvator), F2.2 (fieldMode kÄ±zÄ±l-vizyon), F2.5 (zaman-yolculuÄŸu Ã¶nbelleÄŸi), F2.6 (kamera hata sÄ±nÄ±flandÄ±rmasÄ±), F2.8 (favoriâ†”radar kopmasÄ±) ve F5.1 (persist version+migrate) kapandÄ± â€” bkz. Â§10.
> **DURUM GÃœNCELLEMESÄ° (2026-10-17, Ã¼Ã§Ã¼ncÃ¼ kod oturumu):** F2.7 sensÃ¶r yedeÄŸi (Â§3.5), F4.3 ISS zemin-izi (Â§4.10), F4.5 hata mesajÄ± kanallarÄ± (Â§4.11-FETCH_FAILED) ve F4.2 stale UI gÃ¼ndemi (Â§5'in dÃ¶rt satÄ±rÄ±) giderildi. F2.7 ile **Faz 2'nin kod tarafÄ± tamamen kapandÄ±**; kalan tek iÅŸ cihaz doÄŸrulama gÃ¼nÃ¼ (Â§C). lint 0/0 Â· test **38 dosya / 129 test** Â· build âœ”. Cihaz gerektiren kalemler (Â§4.5 projeksiyon, Â§3.3 kart gÃ¶rseli, F1.4/F1.2/F1.3 davranÄ±ÅŸÄ±) Â§C kontrol listesiyle telefon iÃ§in bekliyor. YalnÄ±zca ROADMAP.md (v2) ile eÅŸ Ã§alÄ±ÅŸÄ±r.
> **DURUM GÃœNCELLEMESÄ° (2026-10-17, dÃ¶rdÃ¼ncÃ¼ kod oturumu):** **F4.1 (Â§4.6) ve F4.4 (Â§4.9 + Â§4.11'in servis/uyarÄ± damarlarÄ±)** giderildi â†’ **Faz 4'Ã¼n kod tarafÄ± tamam** (istisna: Â§3.6 eÅŸik ayar UI'si bilinÃ§li olarak Faz 6'ya taÅŸÄ±ndÄ±). Meteor Ã§apasÄ±, ISS kelepÃ§esi, sessiz-saat `'quiet'` kanalÄ±, `fetchJsonWithTimeout` (gÃ¶vde okumasÄ± aynÄ± bÃ¼tÃ§e), issService taze-birincil korunumu, TLE yaÅŸ rozeti, clear-sky tek gÃ¼n/tek an push, Â§3.4 web meteor Ã§anÄ±, gelecek-yÄ±l Ã¶n-gÃ¶zÃ¼ ve `kpThresholds.ts` tek Kp eÅŸiÄŸi. AyrÄ±ca cihaz-baÄŸÄ±msÄ±z tsc-saÄŸlÄ±ÄŸÄ±: `arSkyGuides.ts` `Vector(time)` imza uyumu. lint 0/0 Â· test **40 dosya / 155 test** Â· build âœ”. YalnÄ±zca ROADMAP.md (v2) ile eÅŸ Ã§alÄ±ÅŸÄ±r.
> **DURUM GÃœNCELLEMESÄ° (2026-10-17, beÅŸinci kod oturumu):** **Faz 3'ten F3.1 (worker churn), F3.2 (seÃ§icili abonelikler), F3.4 (GPU sahne dÃ¼zeltmeleri) ve F3.6 (basit kazanÄ±mlar)** giderildi â†’ Faz 3'te kalan: **F3.3** (AR kare-dÃ¶ngÃ¼sÃ¼ ayrÄ±lÄ±mlarÄ±, L) ve **F3.5** (gÃ¶k hesabÄ± worker'e taÅŸÄ±ma, L). PaylaÅŸÄ±mlÄ± astronomy worker istemcisi (`astronomyWorkerClient.ts`), gÃ¶rÃ¼nÃ¼r-dakika kapÄ±sÄ± (`isMinuteTickDue`), GPU resize `Math.floor` hizalamasÄ± + `forceContextLoss` + kare-baÅŸÄ±na Set'in silinmesi; App workManager senkronlarÄ±nda yuvarlanmÄ±ÅŸ koordinat anahtarÄ±, `useWeatherQuery` tek yuvarlanmÄ±ÅŸ Ã¶nbellek anahtarÄ±, APOD lazy img + fallback memo, fotoÄŸraf penceresi `Intl.DateTimeFormat` Ã¶nbelleÄŸi, `estimateBortleScale` memo. lint 0/0 Â· test **42 dosya / 166 test** Â· build âœ”. YalnÄ±zca ROADMAP.md (v2) ile eÅŸ Ã§alÄ±ÅŸÄ±r.
> **DURUM GÃœNCELLEMESÄ° (2026-10-17, altÄ±ncÄ± kod oturumu):** **F3.3 (AR kare-dÃ¶ngÃ¼sÃ¼ ayrÄ±lÄ±mlarÄ±) ve F3.5 (gÃ¶k hesabÄ± worker'e) giderildi â†’ Faz 3'Ã¼n KOD TARAFI TAMAMEN BÄ°TTÄ°.** F3.5: yeni `astroEventSearch.ts` worker-safe ham matematik (`events.ts` i18n biÃ§imlendirme katmanÄ±na indi; davranÄ±ÅŸ aynÄ±), astronomy worker'a `events` istek tipi + `requestAstroEventsFromWorker`, yeni `useAstroEventsQuery` (15 dk staleTime + gÃ¼n-anahtarlÄ± anahtar + worker-yok yedeÄŸi) â€” AstroEventsHub dakika tik'inde 3 yÄ±llÄ±k tutulma aramasÄ± + 60 gÃ¼nlÃ¼k gezegen sÃ¼pÃ¼rmesi Ã§alÄ±ÅŸtÄ±rmÄ±yor; hub ayrÄ±ca seÃ§icili aboneliklere geÃ§ti. F3.3: `getContext('2d')` etkinlik-baÅŸÄ±na, `Observer`/`MakeTime` 1 Hz penceresinde, `CELESTIAL_BODIES` modÃ¼l sabiti, `Object.values()` zincirleri dÃ¼z listelerle deÄŸiÅŸti (etiket/crosshair/GPU), twinkle fazÄ± yÄ±ldÄ±z kimliÄŸinden tÃ¼retiliyor (Â§4.5 kalan bulgusu kapandÄ±). lint 0/0 Â· test **43 dosya / 173 test** Â· build âœ”. YalnÄ±zca ROADMAP.md (v2) ile eÅŸ Ã§alÄ±ÅŸÄ±r.
> **DURUM GÃœNCELLEMESÄ° (2026-10-17, yedinci kod oturumu â€” Faz 5 ilk paket):** **F5.2 (storage diagnostics), F5.5 (Leaflet saÄŸlamlÄ±k), F5.7 (a11y hÄ±z kazanÃ§larÄ±) ve F5.6 (i18n saÄŸlamlÄ±k) giderildi.** storageRepository dÃ¼ÅŸÃ¼ÅŸleri (`json-parse-failed`/`native-init-failed`/`write-failed`/`native-write-failed`) dairesel import yaratmayan kancayla `recordDiagnostic`'a baÄŸlandÄ± (`installStorageDiagnostics`, main.tsx akÄ±ÅŸÄ±na dahil; `skyview_diagnostics_v1` self-echo guard); LightPollutionMap ResizeObserver+`invalidateSize` ve uÃ§uÅŸ-yarÄ±ÅŸÄ± mounted-guard'larÄ±; GPS FAB/kapat `aria-label`, HourlyCloudChart Ã§ubuklarÄ± `div`â†’`button` klavye paritesi, arama/range label'larÄ±; ana katalog + i18nExtra 8 dil parite testleri; worker-safe `utils/compass.ts` + `utils/compassLabels.ts` + `compass.*` 8 dil katmanÄ± (gÃ¶k cismi detay/TonightTargets/AR canvas/LPM koordinat sonekleri yerelleÅŸtirildi); `getMoonPhase` lang yolu. lint 0/0 Â· test **43 dosya / 185 test** Â· build âœ”. YalnÄ±zca ROADMAP.md (v2) ile eÅŸ Ã§alÄ±ÅŸÄ±r.
> **DURUM GÜNCELLEMESİ (2026-10-17/18, sekizinci kod oturumu — Faz 5 kapanışı):** **F5.4 (§5'in üç satırı) ve F5.3 giderildi → Faz 5'in kod tarafı TAMAM.** StandardModal/BottomSheet (CSS keyframe animasyon; `motion` Modal zincirinden çıkarıldı → Modal chunk 147→18.7 kB), focus-trap callback-ref deseni (koşullu render'da `RefObject.current` zamanlaması hatası giderildi, tarayıcıda doğrulandı), LIFO geri tuşu registry (`consumeBackButtonModal` pop; `App.tsx` DOM-id hack silindi), `planned` taze-okuma (+ `OBSERVATION_DATA_CHANGED` reaktif). lint 0/0 · tsc 0 · test **46 dosya / 197 test** · build ✔. Yalnızca ROADMAP.md (v3) ile eş çalışır.

---

## 1. YÃ¶netici Ã–zeti

| Alan | Durum |
|---|---|
| Birim testleri | âœ… 43 dosya / **185** test â€” yeÅŸil (~3 sn) |
| YerelleÅŸtirme paritesi | âœ… 8 dilde anahtar eÅŸitliÄŸi tam â€” **yedinci oturumda ana katalog + `i18nExtra` aÄŸaÃ§/flat tam parite testi eklendi** (F5.6). Faz 1'de `locationMessages` flat katmanÄ±, Faz 2'de `arMap` +7 anahtar; Ã¼Ã§Ã¼ncÃ¼ oturumda `arMap` +1 (`approxCompass`) ve `weatherStatusMessages` flat katmanÄ± (4 kanal Ã— 8 dil); dÃ¶rdÃ¼ncÃ¼ oturumda `alarmTimingMessages` (3 anahtar Ã— 8 dil); yedinci oturumda `compass.*` (8 anahtar Ã— 8 dil) â€” valid parite |
| `tsc --noEmit` | âœ… **0 hata** |
| ESLint | âœ… **0 hata / 0 uyarÄ±** |
| Mimari/gÃ¶rgÃ¼ kurallar | âœ… i18n tip disiplini, API ÅŸemalarÄ± (zod), AbortSignal iletimi, worker fallback, leaflet temizliÄŸi ve yazma kuyruÄŸu iyi Ã¶rnekler |
| Kritik sorunlar | âš ï¸ **1** iÅŸaretli bulgu aÃ§Ä±k: Â§4.5 (cihaz gÃ¼nÃ¼ doÄŸrulamasÄ±); Â§4.6/Â§4.9/Â§4.10 giderildi |

Genel mimari ve disiplin iyi; **Faz 2/3/4'Ã¼n kod tarafÄ± bitti**. AÃ§Ä±k bulgular artÄ±k kategorik
olarak ikiye ayrÄ±ldÄ±: cihaz-gÃ¼n doÄŸrulamasÄ± (Â§4.5 Ã§ekirdek projeksiyon + Â§C listesi) ve
Faz 5/6 kod kalemleri (F5.2-F5.7, UI modernizasyonu).

---

## 2. Derleme ve Statik DoÄŸrulama

> GÃ¼ncelleme (Faz 0â€“2): `npm run lint` (tsc --noEmit + eslint) bugÃ¼n **0 hata / 0 uyarÄ±**. AÅŸaÄŸÄ±daki tablo FAZ 0 ile GÄ°DERÄ°LDÄ°.

Arka plan notu (geÃ§erli): esbuild tipleri sessizce sildiÄŸi iÃ§in `vite build` yine tip denetimi yapmaz; lint script'i CI'da zorunlu tutulmalÄ±.

---

## 3. Ã‡alÄ±ÅŸmayan / YarÄ±m KalmÄ±ÅŸ Ã–zellikler

### 3.1 AR'da Ã¶lÃ¼ Ä±zgara/ekliptik/gÃ¶ksel ekvator katmanlarÄ± â€” âœ… GÄ°DERÄ°LDÄ° (Faz 2, F2.1)
- Sahne kontrolleri paneline Ã¼Ã§ anahtar eklendi: **Izgara / Ekliptik (GÃ¼n Yolu) / GÃ¶ksel Ekvator** (8 dilde `layerGrid`/`layerEcliptic`/`layerCelestialEquator` anahtarlarÄ±).
- Izgara Ã§izimi (ufuk Ã§emberi, yÃ¼kseklik halkalarÄ±, zenit baÄŸlantÄ±larÄ±) artÄ±k `showGridRef`'e baÄŸlÄ±; pusula harfleri (N/NEâ€¦) her zaman gÃ¶rÃ¼nÃ¼r.
- Yeni `arSkyGuides.ts` modÃ¼lÃ¼ ekliptik (`Rotation_ECT_EQD` â†’ EQD â†’ az/alt; 60 segment) ve gÃ¶ksel ekvator (dec=0, RA taramasÄ±; 36 segment) halkalarÄ±nÄ± 1 Hz Ã¶nbellekte Ã¼retiyor; Canvas fallback renkli/kesik Ã§izgilerle, GPU katmanÄ± ise **ayrÄ± daha soluk `guideLines` LineSegments** katmanÄ±yla Ã§iziyor (arGpuScene.render'a `nightVision`'da kÄ±zÄ±la dÃ¶nen baÄŸÄ±msÄ±z materyal).
- Testler: `arSkyGuides.test.ts` (ekliptik GÃ¼neÅŸ'in az/alt'Ä±ndan <1Â°, halka sÃ¼rekliliÄŸi; ekvator tepe/Ã§ukur â‰ˆ Â±(90âˆ’Ï†)) + `arGpuScene.test.ts` guide tamponu.
- Kalan: cihazda gÃ¶rsel doÄŸrulama (Â§C.10).

### 3.2 `fieldMode` AR haritasÄ±nÄ±n iÃ§inde uygulanmÄ±yordu â€” âœ… GÄ°DERÄ°LDÄ° (Faz 2, F2.2)
`isRedMode = nightMode || fieldMode` hesabÄ± geri getirildi ve **GPU `nightVision` param** + **kap CSS'i** (konteyner arka planÄ±) ile baÄŸlandÄ±. AyrÄ±ca AR aÃ§Ä±kken (`skyview-ar-open` sÄ±nÄ±fÄ±) App-dÃ¼zeyi global kÄ±rmÄ±zÄ± katman CSS ile yumuÅŸatÄ±ldÄ± ve `video` filtresi muaf tutularak Ã§ift kÄ±zÄ±l tonlama Ã¶nlendi (index.css). Cihaz doÄŸrulamasÄ± Â§C.10.

### 3.3 Gezegen bilgi kartÄ± sahte veri gÃ¶steriyordu â€” âœ… GÄ°DERÄ°LDÄ° (Faz 0)
GerÃ§ek `dist` (`Equator().dist`) ve `mag` (`Illumination().mag`) 1 Hz Ã¶nbellekten kart akÄ±ÅŸÄ±na baÄŸlandÄ±; Â§2'deki TS2739 kÃ¶kÃ¼ kapandÄ±; "mocked data" gerekÃ§esi Ã§Ä±karÄ±ldÄ±. Kalan tek iÅŸ: cihazda kart deÄŸerlerinin doÄŸru render edildiÄŸini gÃ¶rmek (JÃ¼piter â‰ˆ âˆ’2,7; NeptÃ¼n â‰ˆ 30,1 AU) â€” roadmap F2.3-rezidÃ¼el.

### 3.4 Meteor yaÄŸmuru Ã§an butonu web'de sessiz â€” `MeteorShowers.tsx:108` â†” `notifications.ts:66` â€” âœ… GÄ°DERÄ°LDÄ° (F4.4, dÃ¶rdÃ¼ncÃ¼ oturum)
Web toggle artÄ±k sessiz Ã§Ä±kmÄ±yor: kÄ±sa Ã§an sesi (Web Audio, `webBell.ts`) + `alarm.webOnly`
mesajÄ± (8 dil, `alarmTimingMessages`) kullanÄ±cÄ±yÄ± uygulama-tek alarma yÃ¶nlendiriyor.
AyrÄ±ca derleme paketinde Ã§an baÄŸÄ±msÄ±z tutuldu (ek asset yok, try/catch-guard'lÄ±).

### 3.5 SensÃ¶r desteklenmediÄŸinde kalibrasyon sihirbazÄ± Ã§Ä±kmaza girer â€” `useCompass.ts:167, 181` â€” âœ… GÄ°DERÄ°LDÄ° (Faz 2 ikinci tur, F2.7)
Android natif yolu `available=false`/baÅŸlatma hatasÄ± dÃ¶nerse web `deviceorientation` dinleyicileri
yedek olarak otomatik baÄŸlanÄ±yor â€” iOS izin akÄ±ÅŸÄ±yla aynÄ± yol. Bu yedek de desteklenmezse
(1200 ms zaman aÅŸÄ±mÄ±) `not-supported` kalÄ±r ve AR'da "pusula yaklaÅŸÄ±k" bilgi pil'i gÃ¶sterilir
(8 dil `approxCompass`). Guard'lar: Â±60 Hz'de deÄŸiÅŸim-Ã¶ncesi `setNativeAccuracy`/`setAbsoluteHeading`
ref-guard; tekrar denemeler yedeÄŸi bozmayan `markNativeUnavailable`. GPS fix gÃ¼rÃ¼ltÃ¼sÃ¼
~111 m snap (`snapCoordinatesForTracking`) ile emiliyor â†’ native izleyici artÄ±k her fix'te
yeniden kurulmuyor (Â§6.2 maddesi de kapandÄ±).

### 3.6 Bildirim eÅŸik ayarlarÄ±nÄ±n UI'sÄ± yok â€” `SmartNotificationSettings.tsx` â†” `featureStorage.ts:16-28` **(aÃ§Ä±k â†’ Faz 6 kapsam notu)**
`cloudThreshold: 30` / `kpThreshold: 5` akÄ±llÄ± bildirimlerin Ã§ekirdek mantÄ±ÄŸÄ±nÄ± belirliyor (hem JS deÄŸerlendirme hem Java `BackgroundAlertWorker`), ancak ayarlar ekranÄ± yalnÄ±zca aÃ§/kapa anahtarlarÄ± sunuyor; kullanÄ±cÄ± bu eÅŸikleri hiÃ§bir yerden ayarlayamÄ±yor. **(F4.4 kapsamÄ±ndan Ã§Ä±karÄ±ldÄ±, bilinÃ§li olarak Faz 6'ya taÅŸÄ±ndÄ±; varsayÄ±lan artÄ±k `kpThresholds.ts` `DEFAULT_KP_ALERT_THRESHOLD`'tan geliyor)**

### 3.7 YapÄ±landÄ±rma tersleri
- ~~**`.env:2` NASA API anahtarÄ± kapatÄ±lmÄ±ÅŸ** â†’ her zaman `DEMO_KEY` kullanÄ±lÄ±r~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F1.6):** gerÃ§ek anahtar aktif. **DIKKAT:** anahtar artÄ±k gerÃ§ek olduÄŸu iÃ§in APK gÃ¶mÃ¼lme/proxy Ã¶nceliÄŸi arttÄ± (aÅŸaÄŸÄ±daki not).
- ~~`.env.example` iÃ§inde hiÃ§bir kodun okumadÄ±ÄŸÄ± ÅŸablon kalÄ±ntÄ±larÄ±~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F1.6)**
- `VITE_NASA_API_KEY` derleme paketine gÃ¶mÃ¼lÃ¼r ve APK iÃ§inden Ã§Ä±karÄ±labilir; gerÃ§ek (Ã¼cretli) anahtar kullanÄ±lacaksa proxy Ã¶nerilir. **(aÃ§Ä±k â€” gÃ¼ncel Ã¶ncelikle VITE_ sonrasÄ± proxy tartÄ±ÅŸmasÄ±)**
- ~~`index.html:7` CSP geliÅŸtirme sunucusunu bozuyor~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F0.4):** CSP artÄ±k yalnÄ±zca Ã¼retim build'inde enjekte ediliyor (`inject-production-csp`).
- ~~`main.tsx:52-56` Ã¶n baÅŸlatma hatasÄ±nda splash sonsuza kadar aÃ§Ä±k kalÄ±r~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F1.7):** `SplashScreen.hide()` + hata kartÄ± akÄ±ÅŸÄ±.
- ~~`vite.config.ts:19` Ã§eviri benzeri koddan kaÃ§mÄ±ÅŸ bozuk (mojibake) yorum~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F0.5)**

---

## 4. Kritik MantÄ±ksal Hatalar (yÃ¼ksek Ã¶ncelik, kod Ã¼zerinde doÄŸrulanmÄ±ÅŸ)

### 4.1 ISS geÃ§iÅŸ listesinde sonsuz ~1 Hz yeniden Ã§ekme dÃ¶ngÃ¼sÃ¼ â€” âœ… GÄ°DERÄ°LDÄ° (Faz 1, F1.1)
Eski Ã¶nbellek listesi artÄ±k `refreshAt` her zaman geleceÄŸe dÃ¼ÅŸÃ¼rÃ¼lerek (minimum koza geri gelme + stale filtreleme + cooldown) denetleniyor; +3 yeni test mevcut.

### 4.2 Wake Lock ilk arka plandan sonra geri alÄ±namÄ±yordu â€” âœ… GÄ°DERÄ°LDÄ° (Faz 1, F1.2)
`release` olayÄ± dinleniyor â†’ handle `null`'lanÄ±yor; gÃ¶rÃ¼nÃ¼rlÃ¼k dÃ¶nÃ¼ÅŸunda yeniden `acquire()` Ã§alÄ±ÅŸÄ±yor. Cihaz doÄŸrulamasÄ± â†’ Â§C.3.

### 4.3 BaÅŸlangÄ±Ã§ta GPS konumu ve saat dilimi silently eziyordu â€” âœ… GÄ°DERÄ°LDÄ° (Faz 1, F1.3)
`locationSource` persist'e girdi; elle seÃ§im `gps`'i bastÄ±rÄ±yor; koordinatâ†’TZ iki GPS akÄ±ÅŸÄ±nda `resolveTimezoneForCoordinates` ile Ã§Ã¶zÃ¼lÃ¼yor; onay Ã§ipi 8 dilde. Cihaz doÄŸrulamasÄ± â†’ Â§C.2.

### 4.4 AR yakalama GPU katmanÄ±nÄ± boÅŸ Ã§ekiyordu â€” âœ… GÄ°DERÄ°LDÄ° (Faz 1, F1.4)
`preserveDrawingBuffer: true` + capture'da `object-fit: cover` kÄ±rpmasÄ±nÄ±n yeniden Ã¼retimi. **Not (izleme):** buffer tutulumu kÃ¼Ã§Ã¼k bir bellek-fiyat getirir; Â§6.2 izleme listesine referans. Cihaz doÄŸrulamasÄ± â†’ Â§C.1.

### 4.5 AR projeksiyon/etkileÅŸim ailevi bulgular â€” `ARSkyMap.tsx` *(kÄ±smen giderildi; Ã§ekirdek doÄŸrulama cihaz gÃ¼nÃ¼nde)*
- **Ekran dÃ¶nÃ¼ÅŸmÃ¼nde iki eksende negatifleme (473-501)** â€” dokunulmadÄ±; cihazda Â§C.5 ile doÄŸrulama ÅART, gerekirse cihaz-Ã§erÃ§eve modeline gÃ¶re tek noktadan dÃ¼zeltme + altÄ±n test. **(F2.4, aÃ§Ä±k)**
- ~~`zd === 0` Â±Infinity koordinat~~ â†’ **âœ… mevcut guard zaten kapsÄ±yor:** `effZd = zd < 0 ? zd : -0.01` dalÄ± (F2.4 kod incelemesiyle teyit).
- ~~Zaman yolculuÄŸu (Â±120 sa) 1 Hz az/alt Ã¶nbelleÄŸini geÃ§ersizleÅŸtirmiyor~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (Faz 2, F2.5):** Ã¶nbellek anahtarÄ±na offset eklendi; ofset deÄŸiÅŸimi anÄ±nda yeniden hesap.
- ~~Favori yÄ±ldÄ±z iÅŸaretine dokunmak radar-ok navigasyonunu aÃ§ar~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (Faz 2, F2.8):** favori artÄ±k navigasyonu tetiklemiyor; kartta ayrÄ± "hedefe rehberlik" dÃ¼ÄŸmesi var.
- ~~GPU Ä±ÅŸÄ±ltÄ± (twinkle) fazÄ± dizin saymasÄ± gÃ¶rÃ¼nÃ¼r yÄ±ldÄ±z kÃ¼mesi deÄŸiÅŸince kayar~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.3, altÄ±ncÄ± oturum):** twinkle fazÄ± `starTwinklePhase(id)` ile yÄ±ldÄ±z kimliÄŸinden tÃ¼retiliyor (rastgele dizin tablosu silindi; hem Canvas fallback hem GPU `phase` aynÄ± kimlik-fazÄ±nÄ± kullanÄ±r).
- ~~`window.orientation` ile `screen.orientation.angle` `||` karÄ±ÅŸÄ±mÄ±~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (Faz 2):** `screen.orientation.angle` standardÄ± + legacy fallback tek noktada.
- Radar mesafesi pikselâ†’derece dÃ¶nÃ¼ÅŸÃ¼mÃ¼ keyfi `10 px/Â°` Ã§arpanÄ±yla yapÄ±lÄ±yor ve fallback dalÄ± zaten ulaÅŸÄ±lamaz â€” kozmetik, aÃ§Ä±k.

### 4.6 Plan sekmesinde NaN / Invalid Date yolu ve tutarsÄ±z varsayÄ±lanlar â€” `ObservationPlanner.tsx` â€” âœ… GÄ°DERÄ°LDÄ° (dÃ¶rdÃ¼ncÃ¼ oturum, F4.1)
- ~~`i * 24` Ã¶rnek varsayÄ±mÄ± + boÅŸ dizide `new Date(NaN)`~~ â†’ yeni `plannerNightWindow.ts`:
  tek geÃ§iÅŸte yerel-gÃ¼ne gÃ¶re gerÃ§ek indeks gruplamasÄ±; gece penceresi (gÃ¼n â‰¥20:00 + ertesi
  â‰¤04:00) ve Ã§apa (21:00 â†’ yoksa gÃ¼nÃ¼n ilk gerÃ§ek Ã¶rneÄŸi) hep gerÃ§ek unix zaman damgasÄ±ndan
  Ã§Ã¶zÃ¼lÃ¼r. BoÅŸ seri artÄ±k plan Ã¼retmiyor (NaN imkÃ¢nsÄ±z), DST/kesik-son-gÃ¼n kaymasÄ± yok.
- ~~"BugÃ¼n" ortalamasÄ± geÃ§miÅŸ saatleri sayar~~ â†’ "Bu Gece" kartÄ± yalnÄ±zca gelecekteki gece
  saatlerini ortalar (geÃ§miÅŸ saatler kalan planÄ± Ã§arpÄ±tmaz).
- ~~RÃ¼zgar bilinmiyor â†’ 0 km/s (mÃ¼kemmel â†’ puan ÅŸiÅŸer), bulut/nem 50 â€” tutarsÄ±z~~ â†’
  `observationScore` `ScoreInputs`'a `windKnown/humidityKnown` eklendi (bilinmeyen â†’ nÃ¶tr
  faktÃ¶r 50). Testler: `plannerNightWindow.test.ts` (TKS gruplama, gece penceresi, DST-gÃ¼n,
  kesik son gÃ¼n, gelecek-filtre) + `observationScore.test.ts` nÃ¶tr rÃ¼zgar (+9).

### 4.7 APOD hata yolu fiilen kapatÄ±lÄ±r + 4xx yeniden denenir â€” âœ… GÄ°DERÄ°LDÄ° (Faz 1, F1.5)
`fetchError` yÃ¼zeyleniyor; retry selective (4xx hariÃ§); Ã¶zel 429/403/5xx banner'larÄ± eriÅŸilebilir.

### 4.8 APOD tarih hizalamasÄ± ve ÅŸema â€” âœ… GÄ°DERÄ°LDÄ° (Faz 1, F1.5)
`date` parametresi + UTC/yerel hizalÄ± Ã¶nbellek anahtarÄ±; zod ÅŸemasÄ± `http|https` medya URL'lerini kabul ediyor.

### 4.9 Alarm zamanlama matematiÄŸi â€” MeteorShowers / ISSTracker / notifications â€” âœ… GÄ°DERÄ°LDÄ° (dÃ¶rdÃ¼ncÃ¼ oturum, F4.4)
- ~~Meteor alarmlarÄ± 21:00 sabit akÅŸam Ã§apasÄ±ndan Ã¶nerilirdi; kÄ±sa lead'te zirveden sonra
  tetiklenirdi~~ â†’ yeni `alarmTiming.ts` `computeMeteorAlarmTrigger`: gerÃ§ek zirve anÄ±
  (12:00 yerel) Ã§apasÄ±; lead kalan sÃ¼reden uzunsa tetik `min(zirve, ÅŸimdi+60 sn)`'e
  kelepÃ§elenir â€” zirveden sonra tetikleme imkÃ¢nsÄ±z. `alarmTiming.test.ts` (+4).
- ~~ISS alarm tetiÄŸi `yÃ¼kseliÅŸ âˆ’ 15 dk` geÃ§miÅŸe dÃ¼ÅŸer â†’ hata bildirimi ve yeniden deneme yok~~ â†’
  `computeIssAlarmTriggerMs`: yÃ¼kseliÅŸe 15 dk'dan yakÄ±nken tetik yÃ¼kseliÅŸ anÄ±na kelepÃ§elenir
  (kabasÃ¶nÃ¼ `iss.alarmSetApproximate` mesajÄ±); tamamen geÃ§en geÃ§iÅŸ yine hata yolu (+3 test).
- ~~Sessiz-saat ilerlemesi baÅŸarÄ±sÄ±zlÄ±k sayÄ±lÄ±r / "yÄ±ÄŸÄ±lma"~~ â†’ `scheduleNotification` artÄ±k
  ertelenmeyi `'quiet'` kanalÄ±yla sÃ¶ylÃ¼yor; Meteor/ISS `alarm.queuedQuiet` veya kabasÃ¶nÃ¼
  dÃ¼rÃ¼st mesaj gÃ¶steriyor (yancÄ± "zamanÄ±nda kuruldu" bitti) (+1 `notifications.test.ts`).
- ~~Clear-sky uyarÄ±sÄ± tetik-anÄ± anahtarÄ± + 30 dk pencereyle sÃ¼rekli +60 sn yeniden
  planlanabilir~~ â†’ tek gÃ¼n/tek an push modeli: gÃ¼n anahtarlÄ± tek kayÄ±t; yalnÄ±zca yer
  deÄŸiÅŸimi veya â‰¥5 puan bulut iyileÅŸmesi yeniler; 30 dk drift penceresi silindi (+2 test;
  Java tarafÄ±ndaki tarih-anahtarlÄ± bastÄ±rma ile hizalÄ±).

### 4.10 ISS yÃ¶rÃ¼nge izi matematiÄŸi â€” `ISSTracker.tsx` â€” âœ… GÄ°DERÄ°LDÄ° (Faz 4, F4.3)
~~`lat = i Â· sin(Î”lng)` yaklaÅŸÄ±mÄ±~~ â†’ yeni `groundTrack.ts` gerÃ§ek dairesel-yÃ¶rÃ¼nge iliÅŸkisini
etkiler: `Ï† = asin(sin iÂ·sin u)`, `Î» âˆ’ Î©0 = atan2(sin uÂ·cos i, cos u)`; kuadrant-dÃ¼zgÃ¼n ters
Ã§Ã¶zÃ¼mleme `u(dÎ»)`; dÃ¼ÄŸÃ¼m boylamÄ± aynÄ± iliÅŸki Ã¼zerinden mevcut konumdan Ã§Ã¶zÃ¼lÃ¼r (eÄŸri iÅŸaretÃ§iye
tam oturur; TLE-raan yoluyla matematiksel olarak eÅŸdeÄŸer, API staleness'a daha az duyarlÄ±).
Testler: `groundTrack.test.ts` â€” baÄŸÄ±msÄ±z el-hesabÄ± altÄ±n eÄŸri (Â±0,05Â°), parametrik
referansa uyuÅŸma (Â±0,5Â° tolerans), kuzey/gÃ¼ney dal Ã§apasÄ±, tepe noktasÄ± = eÄŸim. (+6 test)

### 4.11 BTC baÅŸka mantÄ±k damarÄ± (Ã¶zet)
- ~~`ObservedSuitability.tsx:145` GPS akÄ±ÅŸÄ±nda cihazÄ±n saat dilimiyle konum kaydedilir~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (Faz 1, F1.3)**
- `weatherService.ts:37-44` saat penceresi devamlÄ± kÄ±salabilir (Ã¶rn. az gecikmiÅŸ Ã¼st kesilme). (izleme)
- ~~`issService.ts:36-47` ikinci istek patlarsa elde edilen taze veri atÄ±lÄ±p eski Ã¶nbelleÄŸe dÃ¼ÅŸÃ¼lÃ¼r~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F4.4, dÃ¶rdÃ¼ncÃ¼ oturum):** geniÅŸletilmiÅŸ (visibleOnly=false) istek baÅŸarÄ±sÄ±zsa taze birincil sonuÃ§ korunuyor; boÅŸ taze liste "gÃ¶rÃ¼nÃ¼r geÃ§iÅŸ yok" bilgisi olarak kalÄ±yor (+1 test).
- ~~TLE yaÅŸÄ± hiÃ§ gÃ¶sterilmez; yol iÃ§eri eski TLE konumlarÄ± uyarÄ±sÄ±z Ã§izilir~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F4.4):** `satelliteService.getTleEpochMs` (YYDDD.FFFFF â†’ unix ms, +2 test) + `SatelliteTracker` TLE yaÅŸ rozeti (â‰¤72 sa yeÅŸil, Ã¶tesi amber; 8 dil title).
- ~~`AuroraForecast.tsx:37-38,65` Kp eÅŸikleri Ã¼Ã§ farklÄ± yerde~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F4.4):** `kpThresholds.ts` tek modÃ¼l (`KP_MODERATE/HIGH/STORM_INDEX`); `AuroraForecast` sÄ±nÄ±f/gradyan eÅŸiÄŸi ve `featureStorage` `DEFAULT_KP_ALERT_THRESHOLD` aynÄ± kaynaktan.
- ~~`fetchWithTimeout` yalnÄ±zca baÅŸlÄ±k fazÄ±nÄ± kapsÄ±yor; yanÄ±tsÄ±z gÃ¶vde okumasÄ± sonsuza dek askÄ±da kalabilir~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F4.4):** `fetchJsonWithTimeout` â€” JSON gÃ¶vde okumasÄ± da aynÄ± AbortController/timeout bÃ¼tÃ§esinde; iss/weather/kp/geocoding/apod servislerine uygulandÄ± (+4 `fetchWithTimeout.test.ts`).
- ~~`App.tsx:82-93` `'FETCH_FAILED'` kontrolÃ¼ Ã¶lÃ¼ koddur; sonuÃ§ta **her** hata "baÄŸlantÄ±nÄ±zÄ± kontrol edin" mesajÄ± ile yorumlanÄ±r~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (Faz 4, F4.5):** `weatherErrors.ts` classifier (offline / timeout / server=5xx+429+kontrat / unknown); mesajlar `weatherStatusMessages` flat katmanÄ±nda 8 dil; App.tsx tek satÄ±r kanal-anahtarÄ±na baÄŸlandÄ±, Ã¶lÃ¼ dal kaldÄ±rÄ±ldÄ±.

---

## 5. UI ve Olay Ä°ÅŸleyici BulgularÄ±

| Konum | Sorun | Faz |
|---|---|---|
| ~~`LightPollutionMap.tsx:275-277` Harita arama ikonu **div** (buton deÄŸil)~~ | âœ… GÄ°DERÄ°LDÄ° (F5.5+F5.7) â€” ikon dekoratif `aria-hidden`'a indi (arama debounce'la otomatik Ã§alÄ±ÅŸÄ±yor; dÃ¼ÄŸme sahte eylem Ã¼retirdi) ve asÄ±l boÅŸluk olan etiketsiz input'a `aria-label` (`obs.searchPlaceholder`) eklendi | F5.5/F5.7 |
| `App.tsx:111-121` | DonanÄ±m geri butonu yalnÄ±zca iki DOM gÃ¶zcÃ¼ id tanÄ±yor | F5.3 |
| ~~`ObservationSuitability.tsx:120-127` Enter ile gÃ¶nderim eski sonucu konum olarak uygular~~ | âœ… GÄ°DERÄ°LDÄ° (F4.2) â€” `resultsForQueryRef` tag-guard'Ä± (arama yoldayken/eski sorguyla Enter yoksayÄ±lÄ±r) | Faz 4 |
| ~~`HourlyCloudChart.tsx:29,41-44` `hoveredIndex` veri deÄŸiÅŸince sÄ±fÄ±rlanmÄ±yor~~ | âœ… GÄ°DERÄ°LDÄ° (F4.2) â€” `useEffect` veri-kimliÄŸi reset'i | Faz 4 |
| ~~`TonightTimeline.tsx:20-21` seÃ§ili saat indisi veri gÃ¼ncellenince sÄ±fÄ±rlanmÄ±yor~~ | âœ… GÄ°DERÄ°LDÄ° (F4.2) â€” `points` kimliÄŸinde filtreye dÃ¼ÅŸer, "en iyi" seÃ§ime dÃ¶ner | Faz 4 |
| `CelestialObjectDetail.tsx:20` | `planned` bayraÄŸÄ± modal aÃ§Ä±lÄ±ÅŸÄ±nda bir kez okunur | F5.3 |
| ~~`ARSkyMap.tsx:97-101` kamera hata tÃ¼rleri hep "izin reddedildi"~~ | âœ… GÄ°DERÄ°LDÄ° (F2.6) â€” hata kodu bazlÄ± gerÃ§ek mesajlar | Faz 2 |
| `ARSkyMap.tsx` + `useFocusTrap.ts:66` | Inline `onClose` â†’ modal aÃ§Ä±kken keydown dinleyicisi yeniden kurulur | F5.4 |
| ~~`LightPollutionMap.tsx:220-231` Modal kapanÄ±nca unmount edilen bileÅŸende setState~~ | âœ… GÄ°DERÄ°LDÄ° (F5.5) â€” `isMountedRef` uÃ§uÅŸ-yarÄ±ÅŸÄ± guard'larÄ±: GPS onayÄ±/zaman-dilimi Ã§Ã¶zÃ¼mÃ¼/arama debounce'u beklerken unmount olursa `setSelectedCoords`/`setSelectionLoading`/`setGpsLoading`/`setSearchLoading` ve geÃ§ gelen `onLocationSelect+onClose` yoksayÄ±lÄ±r | F5.5 |
| ~~`useCameraStream.ts:92` onError lang baÄŸÄ±mlÄ± â†’ AR'da dil deÄŸiÅŸimi kamerayÄ± kapatÄ±p aÃ§ar~~ | âœ… GÄ°DERÄ°LDÄ° (F2.6) â€” onError ref'e taÅŸÄ±ndÄ± | Faz 2 |
| ~~`useCameraStream.ts:41-53` yÃ¶n deÄŸiÅŸiminde akÄ±ÅŸ boyutlarÄ± gÃ¼ncellenmez~~ | âœ… GÄ°DERÄ°LDÄ° (F2.6) â€” video `resize` dinleyicisi | Faz 2 |
| ~~`useCameraStream.ts:77-83` `play()` abort hatasÄ± yanlÄ±ÅŸÃ§a "izin red" olarak sÄ±nÄ±flanÄ±r~~ | âœ… GÄ°DERÄ°LDÄ° (F2.6) â€” ayrÄ± sÄ±nÄ±flandÄ±rma (`AbortError` â†’ sessiz) | Faz 2 |
| ~~`TonightTargets.tsx:254-258` yÃ¼kleme iskeletinin altÄ±nda eski konuma ait liste gÃ¶rÃ¼nÃ¼r~~ | âœ… GÄ°DERÄ°LDÄ° (F4.2) â€” `!targetsLoading` guard'lÄ± liste render'Ä± | Faz 4 |
| ~~`AuroraForecast.tsx:37-38,65`~~ | âœ… GÄ°DERÄ°LDÄ° (F4.4) â€” Kp eÅŸikleri `kpThresholds.ts` tek modÃ¼le | Faz 4 |
| `ObservationSuitability.tsx:340-352` | `AnimatePresence > Suspense` exit animasyonunu kÄ±rar | F5.4/F6.2 |

DoÄŸrulanmÄ±ÅŸ olumlular: ana dÃ¼ÄŸmelerde gerÃ§ek iÅŸleyiciler var (Ã¶lÃ¼ buton yok), leaflet tek sefer baÅŸlatÄ±lÄ±p `map.remove()` ile temizleniyor, istemci istekleri `AbortSignal` alÄ±yor, on-altÄ± interval/RAF/listener'da eÅŸleÅŸen temizlik var.

---

## 6. Performans ve Kaynak VerimliliÄŸi

### 6.1 En yÃ¼ksek etkiyi Ã¼Ã§ kaynak maliyeti
1. ~~**Her dakika worker doÄŸum-Ã¶lÃ¼mÃ¼** â€” `useObserverContext.ts:10` her 60 sn `instant` gÃ¼nceller â†’ `useTonightTargets.ts:73` her tikte yeni modÃ¼l Worker yaratÄ±lÄ±p sonlandÄ±rÄ±lÄ±r.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.1, beÅŸinci oturum):** `astronomyWorkerClient.ts` modÃ¼l-kapsamÄ± lazy singleton + istek-id yÃ¶nlendirme; `useObserverContext` tick'i yalnÄ±zca `visibilityState === 'visible'` ve dakika gerÃ§ekten deÄŸiÅŸince render tetikliyor. Test: `astronomyWorkerClient.test.ts` (10 tÃ¼ketici â‰¥1 worker), `useObserverContext.test.ts`.
2. ~~**GPU yolunda kare-baÅŸÄ±na ayrÄ±lÄ±mlar** â€” `ARSkyMap.tsx`: her karede `Object.values(...).filter(...).map(...)` zincirleri; `getContext('2d')` her karede; `new Observer/MakeTime` her karede.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.3, altÄ±ncÄ± oturum):** `getContext('2d')` etkinlik-baÅŸÄ±na bir kez; `Observer`/`MakeTime` yalnÄ±zca 1 Hz Ã¶nbellek penceresinde yeniden kurulur (radar/arama yollarÄ± Ã¶nbellekli Ã¶rnekleri kullanÄ±r); `CELESTIAL_BODIES` modÃ¼l sabiti; `Object.values()` zincirleri projeksiyon sÄ±rasÄ±nda beslenen dÃ¼z listelerle (`projectedStarList`/`projectedDsoList`) deÄŸiÅŸti (etiket + crosshair + GPU beslemesi). Kare-baÅŸÄ±na `new Set` parÃ§asÄ± **âœ… GÄ°DERÄ°LDÄ° (F3.4)**: `arGpuScene` yeniden-kullanÄ±lan `visibleBodyKeys`.
3. ~~**BÃ¼tÃ¼n maÄŸaza aboneliÄŸi** â€” seÃ§icisiz `useAppStore()` kullanÄ±mÄ± tÃ¼m sayfayÄ± yeniden render eder.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.2, beÅŸinci oturum):** denetimde adÄ± geÃ§en dÃ¶rt dosyada (ObservationPlanner, ObservationSuitability, TodayDashboard, SkyHub) seÃ§icili abonelikler; diÄŸer bileÅŸenler izleme.

### 6.2 DiÄŸer Ã¶nemli maliyetler
- ~~**Ana iÅŸ parÃ§acÄ±ÄŸÄ±nda aÄŸÄ±r gÃ¶k hesabÄ±** â€” `AstroEventsHub.tsx`: 3 yÄ±llÄ±k tutulma arama + gezegen sÃ¼pÃ¼rmeleri worker'sÄ±z.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.5, altÄ±ncÄ± oturum):** ham matematik worker-safe `astroEventSearch.ts`'e taÅŸÄ±ndÄ± ve paylaÅŸÄ±mlÄ± astronomy worker'da Ã§alÄ±ÅŸÄ±yor (yeni `events` istek tipi); `useAstroEventsQuery` 15 dk staleTime + gÃ¼n-anahtarlÄ± anahtarla dakika tik'inde yeniden hesap bitti; worker yoksa ana-thread yedeÄŸi. i18n biÃ§imlendirme ana thread'de kalÄ±r (`formatAstroEventSearch`).
- GPU sahnesi ve native sensÃ¶r takibi `arMode` kapalÄ±yken bile baÅŸlar. (izleme)
- `dispose()` iÃ§inde `forceContextLoss()` yok â€” StrictMode Ã§ift mount'ta GL baÄŸlama birikimi riski. â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.4, beÅŸinci oturum)**
- `three.js setSize/setPixelRatio` kesirli CSS geniÅŸliÄŸinde her karede tetiklenebilir. â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.4):** resize guard `Math.floor` hizalÄ± â€” test var.
- ~~APOD gÃ¶rÃ¼ntÃ¼lerinde `loading="lazy"`/boyut yok; `getFallbackImages(lang)` her render'da 2 kez Ã§aÄŸrÄ±lÄ±r.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.6):** gÃ¶rsellerde `loading="lazy" decoding="async"` (lightbox eager kalÄ±r), `fallbackImages` `useMemo` ile tek yapÄ±ldÄ±.
- ~~`syncBackgroundAlerts` `currentLocation` nesne kimliÄŸine baÄŸlÄ± â€” gereksiz WorkManager Ã§aÄŸrÄ±sÄ±.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.6):** yuvarlanmÄ±ÅŸ koordinat anahtarÄ± deps'te; nesne `getState()` ile okunuyor. AynÄ± tedavi `evaluateSmartNotifications` efektine de uygulandÄ±.
- GPS gÃ¼ncellemesi native izleyiciyi yeniden baÅŸlatÄ±r. â†’ **âœ… GÄ°DERÄ°LDÄ° (F2.7)**
- ~~`Intl.DateTimeFormat` fotoÄŸraf penceresinde saat baÅŸÄ±na yeniden yaratÄ±lÄ±r.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.6):** saat-biÃ§imlendirici modÃ¼l-kapsamÄ± timezone Ã¶nbelleÄŸinde.
- ~~`useCompass` 60 Hz'de deÄŸiÅŸimsizde guard'sÄ±z Ã¼Ã§ setState.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F2.7)**
- `useWeatherQuery` Ã¶nbellek anahtarlarÄ± tutarsÄ±z (ham koordinat vs `.toFixed(4)`). â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.6):** tek yuvarlanmÄ±ÅŸ anahtar query/offline/storage katmanlarÄ±nda.
- `estimateBortleScale` her Ã§aÄŸrÄ±da ÅŸehir/dark-site tablolarÄ±nÄ± tarar. â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.6):** ~111 m yuvarlanmÄ±ÅŸ koordinat memo (256 giriÅŸlik sÄ±nÄ±rlÄ± Ã¶nbellek).
- **F0'dan referans:** `preserveDrawingBuffer: true` hafif bir bellek-Ã§Ã¼nkÃ¼ getirir â€” Â§6.2 izleme notu olarak burada kalÄ±r; sorun gÃ¶rÃ¼lÃ¼rse capture-Ã¶ncesi anlÄ±k okuma stratejisine geÃ§ilir.

### 6.3 Paket(termal) â€” Ã¶lÃ§Ã¼lmÃ¼ÅŸ `dist` boyutlarÄ±
| ParÃ§a | Boyut | Not |
|---|---|---|
| GiriÅŸ `index-*.js` | 297 KB | react + react-dom + react-query + zustand + i18n |
| `App-*.js` | 158 KB | App + paylaÅŸÄ±m |
| `schema-runtime` (zod) | 68 KB | statik zincirden geliyor â†’ baÅŸlangÄ±Ã§ta yÃ¼kleniyor |
| `three-vendor` | 516 KB | âœ… yalnÄ±zca AR sekmesinde lazy (Faz 3 referansÄ±) |
| `LightPollutionMap` (leaflet) | 285 KB | âœ… modal aÃ§Ä±lÄ±nca lazy |
| `ARSkyMap` | 79 KB | lazy |
| CSS | 93 KB | |

Ä°lk aÃ§Ä±lÄ±ÅŸ kabaca **~520 KB JS + 93 KB CSS** (sÄ±kÄ±ÅŸtÄ±rÄ±lmamÄ±ÅŸ). zod birleÅŸtirmeyle giriÅŸ ~%13 kÃ¼Ã§Ã¼lÃ¼r; kod bÃ¶lme stratejisi saÄŸlÄ±klÄ±.

### 6.4 DoÄŸrulanmÄ±ÅŸ temiz alanlar âœ…
- Open-Meteo `timeformat=unixtime` gerÃ§ek UTC epoch dÃ¶ner (canlÄ± sorgulanarak doÄŸrulandÄ±).
- `scheduledAlertCleanup` id tÃ¼retimi deterministik; `getFavoriteApods` gibi senkron okumalar init sÄ±rasÄ±ndan sonra gÃ¼venli.
- `searchAltitude/searchRiseSet` imzalarÄ± astronomy-engine 2.1.19 ile uyumlu.
- MoonRenderer SVG filtre/mask id tamamlÄ±ÄŸÄ± âœ….
- storageRepository yazma kuyruÄŸu ve yaÅŸam dÃ¶ngÃ¼sÃ¼ âœ….

---

## 7. Veri BÃ¼tÃ¼nlÃ¼ÄŸÃ¼ / AltyapÄ± NotlarÄ±

- ~~**Zustand persist'te `version`/`migrate` yok** â€” merge spread'i yabancÄ± anahtarlarÄ± da kopyalar~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (Faz 2, F5.1):** `version: 1` + `migratePersistedAppState` (beyaz liste + alan-bazlÄ± doÄŸrulama: lang/Tab/LocationData/locationSource); `merge` de aynÄ± beyaz listeyi uygular; +5 test. Kalan: `storageRepository` diagnostics â†’ **(F5.2)**
- ~~Bozuk JSON okunursa veri sessizce silinir (`storageRepository.ts:139-145`) â€” hiÃ§biri `recordDiagnostic`'a gitmiyor.~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F5.2, yedinci oturum):** dairesel import yaratmayan `setStorageDiagnosticsListener` kancasÄ± + `diagnostics.ts`'te `installStorageDiagnostics` kablosu (main.tsx akÄ±ÅŸÄ±na dahil); bozuk JSON (`json-parse-failed`, self-healing korunur), native-init dÃ¼ÅŸÃ¼ÅŸÃ¼, web yazma ve native yazma bitimi kaydedilir; almanak anahtarÄ±na self-echo guard (kendi yazÄ±mÄ±nÄ± kaydetmez â†’ Ã¶zyineleme imkÃ¢nsÄ±z). â€” **(F5.2 âœ…)**
- Eski localStorageâ†’native gÃ¶Ã§ sÄ±ralamasÄ± native'i her zaman kazanÄ±r. (izleme)
- ~~`CapacitorApp.getLaunchUrl()` hiÃ§ kullanÄ±lmÄ±yor~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (Faz 1, F1.7)**
- ~~`useWeatherQuery` Ã¶nbellek anahtarlarÄ± tutarsÄ±z (ham koordinat vs `.toFixed(4)`).~~ â†’ **âœ… GÄ°DERÄ°LDÄ° (F3.6):** tek yuvarlanmÄ±ÅŸ anahtar.
- i18n bÃ¼tÃ¼nlÃ¼k testi yalnÄ±zca `productMessageCatalog` paritesini korur; 259 anahtarlÄ±ca ana katalog ve `i18nExtra` parite denetimi yok. **(F5.6)**
- `getMoonPhase(x)` `lang` olmadan Ã§aÄŸrÄ±lÄ±yor; pusula kÄ±saltmalarÄ± lokalize deÄŸil. **(F5.6)**
- ArapÃ§a RTL: `dir` iki kez atanÄ±r âœ…; canvas Ã§izimleri RTL'de dÃ¶nmez (cihaz kontrolÃ¼ Â§C.6).
- `tsconfig.json`: `noUncheckedIndexedAccess` yok; Ã¶lÃ¼ bayraklar; Ã§eviri depolarÄ±na tip denetimi yok.
- Renk Ã§akÄ±ÅŸmasÄ±: splash `#0a0a0f` vs `#010204` â€” aÃ§Ä±lÄ±ÅŸta tint adÄ±mÄ± gÃ¶rÃ¼nÃ¼r. **(F6.1)**

---

## 8. UI ModernleÅŸme Ã–nerileri

Mevcut taban saÄŸlam: Tailwind v4 `@theme` belirteÃ§leri, Ã§ift yazÄ± tipi, gÃ¼venli alan yardÄ±mcÄ±larÄ±, gece-modu katmanÄ± zaten var. Ã–neriler (Faz 6 eÅŸleÅŸmesi):

1. Tek yÃ¼zey + elevation sistemi (`Surface` yaygÄ±nlaÅŸtÄ±rma) â€” **F6.1**
2. Mono-sayÄ± kuralÄ± â€” **F6.3**
3. Renk konsolidasyonu `--sv-*` â€” **F6.1**
4. Standart modal bileÅŸeni (focus trap + ESC + aria-modal + geri kenarÄ±) â€” **F5.4/F6.2**
5. Bottom sheet deseni (APOD lightbox, cism detayÄ±, gÃ¼nlÃ¼k) â€” **F5.4/F6.2**
6. AR HUD ÅŸeridi (FOV/azimut/kalite cam-pill) â€” **F6.4**
7. Count-up + `prefers-reduced-motion` â€” **F6.7**
8. BoÅŸ durumlar standardÄ± â€” **F6.6**
9. Haptic sÃ¶z varlÄ±ÄŸÄ± â€” **F6.8**
10. Pull-to-refresh + merkezi Toast â€” **F6.9**
11. EriÅŸilebilirlik hÄ±z kazanÄ±mÄ± â€” **F5.7 âœ… (yedinci oturum)**
12. RTL canvas kontrolÃ¼ â€” cihaz (Â§C.6)

**GÃ¶rsel fikirler:** gÃ¼n Ã¶zeti "hero" kartÄ± (F6.5), meteor "kalan gÃ¼n" Ã§ubuklarÄ± (F6.10), takvimde bugÃ¼n vurgusu, AR debug overlay (cihaz gÃ¼nÃ¼nde iÅŸe yarar).

---

## 9. Ã–ncelikli DÃ¼zeltme Listesi (kalan iÅŸler)

| # | Ã–ncelik | Kalan bulgu | Yer | Faz |
|---|---|---|---|---|
| 1 | ğŸ”´ Cihaz gÃ¼nÃ¼ | AR projeksiyon doÄŸrulama (Â§C.5) + F1.4/F1.2/F1.3 cihaz teyidi | `ARSkyMap.tsx`, Â§C.1/C.2/C.3 | F2.4 |
| 2 | ğŸŸ¡ Modal ailesi | Standart Modal/BottomSheet + donanÄ±m geri tuÅŸu kaydÄ± | Â§5 tablo, `App.tsx:111-121` | F5.4+F5.3 |
| 3 | ğŸŸ¡ Bildirim eÅŸik UI | Â§3.6 â€” bilinÃ§li olarak Faz 6'ya taÅŸÄ±ndÄ± | `SmartNotificationSettings.tsx` | F6 |

> Yedinci oturumda kapatÄ±lanlar: F5.2 (storage diagnostics), F5.5 (Leaflet saÄŸlamlÄ±k), F5.7 (a11y hÄ±z kazanÃ§larÄ±), F5.6 (i18n saÄŸlamlÄ±k) â†’ **Faz 5'te yalnÄ±zca F5.3+F5.4 (modal ailesi) kaldÄ±** â€” bkz. Â§10. Kod tarafÄ±nda kalan: F5.3/F5.4 + Faz 6.

---

## 10. Giderilenler (Faz 0â€“2, 2026-10-17)

### Faz 0
- **F0.1** GerÃ§ek `dist`/`mag` 1 Hz Ã¶nbellekten gezegen kartÄ±na (`Equator().dist`, `Illumination().mag`) + TS2739 kapandÄ± (Â§2, Â§3.3).
- **F0.2/F0.3** Ã–lÃ¼ kod temizliÄŸi + F2.1 state/ref iskeleti.
- **F0.4 CSP prod-only** (`inject-production-csp`) â€” dev react-refresh sorunu bitti.
- **F0.5** vite.config mojibake temizliÄŸi.
- `.eslintrc` `ignorePatterns` [dist, android].

### Faz 1
- **F1.1** ISS dÃ¶ngÃ¼ + stale filtre + cooldown (+3 test) â€” Â§4.1.
- **F1.2** Wake lock `release` olayÄ± â†’ yeniden edinim â€” Â§4.2 (cihaz Â§C.3).
- **F1.3** `locationSource` persist + 8 dilde onay Ã§ipi + iki GPS akÄ±ÅŸÄ±nda koordinat-TZ (`resolveTimezoneForCoordinates`) â€” Â§4.3 + Â§4.11-TZ (cihaz Â§C.2).
- **F1.4** `preserveDrawingBuffer` + capture'da `object-fit: cover` â€” Â§4.4 (cihaz Â§C.1).
- **F1.5** APOD `fetchError` yÃ¼zeyi + selective retry + tarih hizalamasÄ± + `http` medya ÅŸemasÄ± â€” Â§4.7/Â§4.8.
- **F1.6** NASA gerÃ§ek anahtar + `.env.example` temizliÄŸi â€” Â§3.7.
- **F1.7** Splash hide + bootstrap hata kartÄ± + `getLaunchUrl` â€” Â§3.7.

### Faz 2 (kod tarafÄ±, cihaz doÄŸrulamasÄ± bekliyor)
- **F2.1** Sahne katman toggle'larÄ±: Izgara/Ekliptik/GÃ¶ksel Ekvator anahtarlarÄ±; grid Ã§izim koÅŸullandÄ±; ekliptik + gÃ¶ksel ekvator halkalarÄ± `arSkyGuides.ts`'te Ã¼retilip Canvas + GPU (`guideLines` ayrÄ± katman) Ã§izildi; `arSkyGuides.test.ts` + `arGpuScene.test.ts` guide tampon testleri. â€” Â§3.1
- **F2.2** `isRedMode = nightMode || fieldMode` GPU nightVision + kap CSS; AR aÃ§Ä±kken app-overlay yumuÅŸatma + video filtre muafiyeti (index.css). â€” Â§3.2
- **F2.5** Zaman-yolculuÄŸu ofseti 1 Hz Ã¶nbelleÄŸi geÃ§ersiz kÄ±lÄ±yor. â€” Â§4.5
- **F2.6** Kamera hata sÄ±nÄ±flandÄ±rmasÄ± (`classifyCameraError`: denied/busy/missing/aborted/unknown) + hook iÃ§inde `onError` ref + video `resize` boyut gÃ¼ncelleme + `play()` AbortError sessiz triajÄ±; AR mesajlarÄ± gerÃ§ek nedene baÄŸlandÄ± (8 dil). â€” Â§5
- **F2.4 (kod parÃ§asÄ±)** `screen.orientation.angle` standardÄ± (legacy fallback); `zd === 0` guard mevcudunun teyidi. Ã‡ekirdek projeksiyon doÄŸrulamasÄ± cihaz gÃ¼nÃ¼nde.
- **F2.8** Favori â†’ radar navigasyon kopmasÄ±; kartta ayrÄ± rehberlik dÃ¼ÄŸmesi. â€” Â§4.5
- **F5.1** Persist `version: 1` + `migratePersistedAppState` (beyaz liste + doÄŸrulama) + merge guard; +5 `useAppStore` testi. â€” Â§7

### QA (Faz 0â€“2, iki oturum)
- `npm run lint` **0 hata / 0 uyarÄ±** Â· `npm run test` 36 dosya / 115 test yeÅŸil Â· `npm run build` âœ”

### ÃœÃ§Ã¼ncÃ¼ kod oturumu (2026-10-17)
- **F2.7** SensÃ¶r yedeÄŸi: native `available=false`/hata â†’ web `deviceorientation` yedeÄŸi (iOS izin akÄ±ÅŸÄ± yolu; `webFallbackNeeded` tetikli); `approxCompass` 8 dilde AR pil'i; `setNativeAccuracy`/`setAbsoluteHeading` ref-guard (60 Hz); `markNativeUnavailable` rerun'lar yedeÄŸi bozmuyor; `snapCoordinatesForTracking` (~111 m) GPS-noise restart churn'ini kesiyor (Â§6.2 maddesi). â€” Â§3.5, Â§6.2 (+3 test)
- **F4.3** ISS zemin-izi: `groundTrack.ts` (Ï† = asin(sin iÂ·sin u), Î»âˆ’Î©0 = atan2(sin uÂ·cos i, cos u), kuadrant-dÃ¼zgÃ¼n ters + konum-Ã§apalÄ± dÃ¼ÄŸÃ¼m Ã§Ã¶zÃ¼mÃ¼); `ISSTracker.tsx` `iÂ·sin(Î”Î»)` yaklaÅŸÄ±mÄ± kalktÄ±. â€” Â§4.10 (+`groundTrack.test.ts`, 6 test: el-hesabÄ± altÄ±n eÄŸri Â±0,05Â°, parametrik Â±0,5Â°, dal Ã§apasÄ±)
- **F4.5** Hata kanallarÄ±: `weatherErrors.ts` (offline / timeout / server / unknown; FetchTimeoutError, HTTP_5xx+429, ApiContractError, baÄŸlantÄ±-dÃ¼ÅŸmesi tanÄ±mlarÄ±); `weatherStatusMessages` (i18n.ts flat, 8 dil Ã— 4); App.tsx Ã¶lÃ¼ `FETCH_FAILED` dalÄ± silindi. â€” Â§4.11 (+5 test)
- **F4.2** Stale UI: HourlyCloudChart/TonightTimeline veri-kimliÄŸi resetleri; TonightTargets `!targetsLoading` liste guard'Ä±; ObservationSuitability Enter yarÄ±ÅŸÄ± `resultsForQueryRef` tag ile. â€” Â§5 tablo (4 satÄ±r)
- **QA (gÃ¼ncel):** lint 0/0 Â· test **38 dosya / 129 test** yeÅŸil Â· build âœ” (three-vendor >500 kB bilinen uyarÄ±, Faz 3 referansÄ±)

### DÃ¶rdÃ¼ncÃ¼ kod oturumu (2026-10-17, F4.1 + F4.4 â€” Faz 4 kod kapanÄ±ÅŸÄ±)
- **F4.1** Plan matematiÄŸi: yeni `plannerNightWindow.ts` â€” `groupHourlyIndicesByLocalDay` (tek geÃ§iÅŸte yerel-gÃ¼n gruplamasÄ±), `nightWindowIndicesForDay`, `findAnchorIndexForDay` (21:00 â†’ gÃ¼nÃ¼n ilk gerÃ§ek Ã¶rneÄŸi), `filterUpcomingIndices`; `ObservationPlanner.tsx` `i*24`/NaN/NexDay dizisi silindi; "Bu Gece" ortalamasÄ± gelecek-saat filtresi; `observationScore` `windKnown/humidityKnown` nÃ¶tr faktÃ¶r (bilinmeyen rÃ¼zgar artÄ±k 0 km/s=mÃ¼kemmel sayÄ±lmÄ±yor). â€” Â§4.6 (+`plannerNightWindow.test.ts` 7 + `observationScore.test.ts` 2)
- **F4.4** Alarm & servis paketi:
  - `alarmTiming.ts`: `computeMeteorAlarmTrigger` (gerÃ§ek zirve anÄ± Ã§apasÄ±, kelepÃ§e) + `computeIssAlarmTriggerMs` (yÃ¼kseliÅŸe<15 dk â†’ yÃ¼kseliÅŸ anÄ±; geÃ§en geÃ§iÅŸ â†’ null hata yolu). â€” Â§4.9 (+7 test)
  - `notifications.ts` `'quiet'` kanalÄ±: sessiz-saat ertelenmesi artÄ±k Ã¶ÄŸrenilebilir; MeteorShowers/ISSTracker dÃ¼rÃ¼st tostlar (`alarm.queuedQuiet` 8 dil `alarmTimingMessages`). â€” Â§4.9 (+1 test)
  - `fetchWithTimeout.ts` `fetchJsonWithTimeout`: JSON gÃ¶vde okumasÄ± da aynÄ± AbortController/timeout; iss/weather/kp/geocoding/apod servislerine uygulandÄ±. â€” Â§4.11 (+4 test)
  - `issService.ts`: ikinci istek hatasÄ±nda taze birincil sonuÃ§ korunumu. â€” Â§4.11 (+1 test)
  - `satelliteService.getTleEpochMs` + SatelliteTracker TLE yaÅŸ rozeti (â‰¤72 sa yeÅŸil / amber; 8 dil title). â€” Â§4.11 (+2 test)
  - `smartNotifications.ts` clear-sky: tek gÃ¼n/tek an push (gÃ¼n anahtarÄ±; yer deÄŸiÅŸimi veya â‰¥5 puan iyileÅŸme hariÃ§ yeniden planlama; 30 dk drift penceresi silindi). â€” Â§4.9 (+2 test)
  - Â§3.4 web meteor Ã§anÄ±: `webBell.ts` (Web Audio Ã§ift harmonik Ã§an) + `alarm.webOnly` mesajÄ±. â€” Â§3.4
  - Gelecek-yÄ±l Ã¶n-gÃ¶zÃ¼: tÃ¼m zirveler geÃ§ince ilk 3 gelecek-yÄ±l gÃ¶sterisi yÄ±l rozetiyle listelenir; alarm kurulumu da Ã¶nizlemeden Ã§alÄ±ÅŸÄ±r (`events.nextYearPreview`).
  - `kpThresholds.ts`: Kp orta/yÃ¼ksek/fÄ±rtÄ±na eÅŸiÄŸi + `DEFAULT_KP_ALERT_THRESHOLD` tek kaynak. â€” Â§4.11
- **Ek**: `arSkyGuides.ts` `new Vector(x, y, z, time)` â€” astronomy-engine `Vector` 4-arg imza uyumu (cihaz baÄŸÄ±msÄ±z, tsc blokeri; dÃ¶rdÃ¼ncÃ¼ oturum QA'sÄ±nda tespit).
- **QA (gÃ¼ncel):** lint **0 hata / 0 uyarÄ±** Â· `tsc --noEmit` **0** Â· test **40 dosya / 155 test** yeÅŸil Â· build âœ” (three-vendor >500 kB bilinen uyarÄ±, Faz 3 referansÄ±)

### BeÅŸinci kod oturumu (2026-10-17, Faz 3: F3.1 + F3.2 + F3.4 + F3.6)
- **F3.1** Worker churn: yeni `astronomyWorkerClient.ts` â€” modÃ¼l-kapsamÄ± lazy singleton; `postMessage` istekleri id etiketli, yanÄ±tlar id ile yÃ¶nlendirilir (paylaÅŸÄ±mlÄ± worker'da sÄ±ra dÄ±ÅŸÄ±/Ã§akÄ±ÅŸan yanÄ±tlar gÃ¼venli); worker hatasÄ± bekleyen tÃ¼m isteklere gider, Ã¶lÃ¼ Ã¶rnek dÃ¼ÅŸÃ¼rÃ¼lÃ¼r, sonraki istek yeniden yaratmayÄ± dener; cancel closure'su geÃ§ yanÄ±t bÄ±rakmaz. `astronomy.worker.ts` id-echo protokolÃ¼ne geÃ§ti. `useTonightTargets` artÄ±k asla Worker doÄŸurmaz/Ã¶ldÃ¼rmez (yalnÄ±zca istek + main-thread fallback). `useObserverContext`: dakika tik'i `isMinuteTickDue` kapÄ±sÄ±yla â€” gizli belgede Ã§alÄ±ÅŸmaz, dakika deÄŸiÅŸmeden re-render etmez, `visibilitychange`'de yetiÅŸtirir. â€” Â§6.1 (+`astronomyWorkerClient.test.ts` 4 test: 10 tÃ¼ketici â‰¥1 worker, hata yÃ¶nlendirme + yeniden yaratma, cancel, inÅŸa-baÅŸarÄ±sÄ±zlÄ±ÄŸÄ±; +`useObserverContext.test.ts` 4 test)
- **F3.2** SeÃ§icili maÄŸaza abonelikleri: `ObservationPlanner`, `ObservationSuitability`, `TodayDashboard`, `SkyHub` â€” seÃ§icisiz `useAppStore()` kaldÄ±rÄ±ldÄ±; ilgisiz maÄŸaza yazÄ±mlarÄ± artÄ±k bu sayfalarÄ± yeniden render etmiyor. â€” Â§6.1
- **F3.4** GPU sahne dÃ¼zeltmeleri: `arGpuScene.ts` â€” resize guard `Math.floor` hizalÄ± (three.js iÃ§i `floor(w*ratio)` ile eÅŸleÅŸir; kesirli CSS geniÅŸliÄŸinde kare-baÅŸÄ±na setSize/setPixelRatio bitti); `dispose()` iÃ§inde `forceContextLoss()` (StrictMode Ã§ift-mount GL sÄ±zÄ±ntÄ±sÄ±); `updateBodies` kare-baÅŸÄ±na `new Set` yerine yeniden-kullanÄ±lan `visibleBodyKeys`. Test mock'u gerÃ§ekÃ§i three davranÄ±ÅŸÄ±nÄ± yansÄ±tÄ±yor (+3 test: floor guard, context-loss, Set yeniden-kullanÄ±mÄ±).
- **F3.6** Basit kazanÄ±mlar:
  - `App.tsx` `syncBackgroundAlerts` + `evaluateSmartNotifications`: deps yuvarlanmÄ±ÅŸ koordinat anahtarÄ±na baÄŸlÄ±; `currentLocation` `getState()` ile okunur â€” GPS fix baÅŸÄ±na gereksiz WorkManager Ã§aÄŸrÄ±sÄ± bitti. â€” Â§6.2
  - `useWeatherQuery`: query/offline/storage Ã¶nbellek anahtarlarÄ± tek `.toFixed(4)` yuvarlanmÄ±ÅŸ anahtarda birleÅŸti. â€” Â§7
  - `NASAAPOD`: `fallbackImages` `useMemo` (dil baÅŸÄ±na tek yapÄ±); favori kÃ¼Ã§Ã¼k resimleri ve ana gÃ¶rselde `loading="lazy" decoding="async"` (lightbox gÃ¶rseli eager).
  - `arPhotoGuide.ts`: saat-biÃ§imlendirici modÃ¼l-kapsamÄ± timezone Ã¶nbelleÄŸinde â€” fotoÄŸraf penceresi hesabÄ± artÄ±k saat baÅŸÄ±na yeni `Intl.DateTimeFormat` yaratmÄ±yor. â€” Â§6.2
  - `events.ts` `estimateBortleScale`: ~111 m yuvarlanmÄ±ÅŸ koordinat memo (256 giriÅŸlik sÄ±nÄ±rlÄ± Ã¶nbellek); davranÄ±ÅŸ deÄŸiÅŸmedi.
- **QA (gÃ¼ncel):** lint **0 hata / 0 uyarÄ±** Â· `tsc --noEmit` **0** Â· test **42 dosya / 166 test** yeÅŸil Â· build âœ” (three-vendor >500 kB bilinen uyarÄ±)

### AltÄ±ncÄ± kod oturumu (2026-10-17, Faz 3 kapanÄ±ÅŸÄ±: F3.3 + F3.5)
- **F3.5** GÃ¶k hesabÄ± worker'da:
  - Yeni `astroEventSearch.ts`: worker-safe ham matematik â€” `computeEclipseEventsRaw` (3 yÄ±llÄ±k GÃ¼neÅŸ/Ay tutulma aramasÄ±) + `computePlanetCloseApproachesRaw` (60 gÃ¼n Ã— 4 saat Ã— 5 gezegen sÃ¼pÃ¼rmesi) seri-leÅŸtirilebilir satÄ±rlar dÃ¶ndÃ¼rÃ¼r (`dateMs`, string enum, sayÄ±lar); i18n/iÃ§ermez, `dateTime.ts` yardÄ±mcÄ±larÄ± worker-uyumlu. `computeAstroEventSearchRaw` ikisini birleÅŸtirir; `DEFAULT_OBSERVER_LOCATION` buraya taÅŸÄ±ndÄ±. â€” Â§6.1/Â§6.2
  - `events.ts`: `buildEclipseEvents`/`buildPlanetCloseApproaches` matematik kÄ±smÄ± Ã§Ä±karÄ±ldÄ±; i18n biÃ§imlendirme katmanÄ± kaldÄ± (yeni `formatAstroEventSearch`, `formatEclipseEvent`, `formatPlanetApproach`). `getAstroEvents` imzasÄ± ve davranÄ±ÅŸÄ± aynÄ± (`events.test.ts` deÄŸiÅŸmeden yeÅŸil).
  - `astronomy.worker.ts`: `events` istek tipi (`id` + `kind:'events'` + `fromMs/latitude/longitude/timeZone`) â†’ `{ id, eclipses, approaches }` yanÄ±tÄ±; mevcut tonight yolu korundu.
  - `astronomyWorkerClient.ts`: pending kaydÄ± iki kanallÄ± (`onReply`/`onError`) â€” mevcut API ve testler bozulmadan; yeni `requestAstroEventsFromWorker` (aynÄ± id-echo, Ã¶lÃ¼-worker hata rotasÄ± ve cancel sÃ¶zleÅŸmesi).
  - Yeni `useAstroEventsQuery`: react-query, `staleTime` **15 dk**, anahtar `['astro-events', lang, tz, lat.toFixed(4), lng.toFixed(4), localDayKey]` â€” dakika tik'i (F3.1 kapÄ±sÄ±) kataloÄŸu yeniden hesaplamaz; worker-yok/hata â†’ ana-thread yedeÄŸi (eski davranÄ±ÅŸ), sinyal-abort yedeÄŸe dÃ¼ÅŸmez.
  - `AstroEventsHub.tsx`: seÃ§ici `useAppStore(s => â€¦)` abonelikleri (F3.2 deseni) + query tabanlÄ± `upcomingEvents` (yalnÄ±zca ucuz filtre/sÄ±ralama).
  - Testler: `astroEventSearch.test.ts` (+5) ve `astronomyWorkerClient.test.ts` events-yÃ¶nlendirme (+2) = **+7**.
- **F3.3** AR kare-dÃ¶ngÃ¼sÃ¼ ayrÄ±lÄ±mlarÄ± â€” `ARSkyMap.tsx`:
  - `getContext('2d')` render baÅŸÄ±na deÄŸil; efekt yaÅŸam dÃ¶ngÃ¼sÃ¼nde bir kez (baÄŸlam, backing-store resize'Ä±ndan korunur).
  - `new Observer` + `MakeTime` yalnÄ±zca 1 Hz Ã¶nbellek penceresinde (ve F2.5 zaman-yolculuÄŸu ofset deÄŸiÅŸiminde) kurulur; radar/arama yollarÄ± (`Horizon`) Ã¶nbellekli Ã¶rnekleri kullanÄ±r â€” ilk kare iÃ§in etkinlik-baÅŸÄ±nda eager ilk deÄŸer.
  - `celestialBodiesList` her 1 Hz yenilemede yeniden inÅŸa edilmekten Ã§Ä±ktÄ± â†’ `CELESTIAL_BODIES` modÃ¼l sabiti.
  - `Object.values(projectedStarsMap).filter().map()` ve etiket/crosshair `Object.keys` taramalarÄ± â†’ projeksiyon sÄ±rasÄ±nda beslenen **dÃ¼z listeler** (`projectedStarList`/`projectedDsoList`); GPU star/deepSky dizileri ve etiket dÃ¶ngÃ¼leri bu listelerden okur.
  - Twinkle fazÄ± `starTwinklePhase(id)` â€” yÄ±ldÄ±z kimliÄŸinden deterministik hash; rastgele dizin tablosu (her efekt kurulumunda deÄŸiÅŸen + gÃ¶rÃ¼nÃ¼r kÃ¼me deÄŸiÅŸince kayan) silindi; Canvas fallback ve GPU `phase` aynÄ± kimlik-fazÄ±nÄ± paylaÅŸÄ±r. â€” Â§4.5 kalan bulgusu
- **QA (gÃ¼ncel):** lint **0 hata / 0 uyarÄ±** Â· `tsc --noEmit` **0** Â· test **43 dosya / 173 test** yeÅŸil Â· build âœ” (three-vendor >500 kB bilinen uyarÄ±)

### Yedinci kod oturumu (2026-10-17, Faz 5 ilk paket: F5.2 + F5.5 + F5.7 + F5.6)
- **F5.2** storageRepository diagnostics:
  - `storageRepository.ts`: `setStorageDiagnosticsListener` kancasÄ± (modÃ¼lÃ¼n diagnostics'i import etmemesi iÃ§in â€” dairesel baÄŸÄ±mlÄ±lÄ±k kÄ±rÄ±ldÄ±); dÃ¼ÅŸÃ¼ÅŸler kayÄ±t altÄ±na alÄ±ndÄ±: bozuk JSON (`json-parse-failed`, self-healing davranÄ±ÅŸÄ± korunur), native init dÃ¼ÅŸÃ¼ÅŸÃ¼ (`native-init-failed`), web yazma hatasÄ± (`write-failed`), native yazma 3 deneme sonrasÄ± (`native-write-failed`, rollbackle birlikte).
  - `diagnostics.ts`: yeni `installStorageDiagnostics()` â€” kancayÄ± `storage.${event.name}` formunda almanaÄŸa baÄŸlar; `installGlobalObservability` iÃ§inde kurulur ve cleanup'ta sÃ¶kÃ¼lÃ¼r (main.tsx akÄ±ÅŸÄ±yla otomatik). Self-echo guard: `skyview_diagnostics_v1` almanak anahtarÄ±ndaki dÃ¼ÅŸÃ¼ÅŸ kaydedilmez (kendi yazÄ±mÄ±nÄ±n dÃ¼ÅŸmesi sonsuz Ã¶zyineleme doÄŸurmaz).
  - `HybridStorageRepository` test amaÃ§lÄ± dÄ±ÅŸa aÃ§Ä±k hale geldi.
  - Testler: `storageRepository.test.ts` (diagnostics 5 + yaÅŸam dÃ¶ngÃ¼sÃ¼ 4: localStorageâ†’native gÃ¶Ã§Ã¼, FIFO yazma kuyruÄŸu, `flush()` tahliye-bekliyor, `keys()` Ã¶n-ek) + `diagnostics.test.ts` 2 (almanaÄŸa yazÄ±m, self-echo) = **+11**.
  - **DÃ¼rÃ¼stlÃ¼k kaydÄ±:** oturum sÄ±rasÄ±nda mevcut `storageRepository.test.ts` Ã¼zerine yanlÄ±ÅŸlÄ±kla yazÄ±ldÄ± ve eski iÃ§eriÄŸin 3 testi kayboldu; kaybolan kapsamÄ±n (yazma kuyruÄŸu/yaÅŸam dÃ¶ngÃ¼sÃ¼) yeniden inÅŸa hali yukarÄ±daki 11 test grubunda (daha geniÅŸ) saÄŸlandÄ±.
- **F5.5** Leaflet saÄŸlamlÄ±k â€” `LightPollutionMap.tsx`:
  - `ResizeObserver` â†’ `mapRef.current?.invalidateSize()` (dÃ¶nÃ¼ÅŸ Â§C.8 ve mount animasyonu; ResizeObserver yoksa atlanÄ±r).
  - `isMountedRef` uÃ§uÅŸ-yarÄ±ÅŸÄ± guard'larÄ±: GPS izin+konum akÄ±ÅŸÄ±, debounce'lu arama (`setSearchLoading`/`setSearchResults`), `resolveTimezoneForCoordinates` sonrasÄ± `onLocationSelect+onClose` â€” hepsi mount edilmiÅŸken Ã§alÄ±ÅŸÄ±r; kapat-sonra-seÃ§ yarÄ±ÅŸÄ± kapandÄ±. â€” Â§5 tablo
- **F5.7** a11y hÄ±z kazanÃ§larÄ±:
  - `aria-label` (hepsi mevcut anahtarlarla, sÄ±fÄ±r yeni aÄŸaÃ§ anahtarÄ±): LPM GPS FAB (`lpm2.goToLocation`), LPM kapat (`common.close`), ObservationSuitability arama input (`obs.searchPlaceholder`) + submit (`obs.searchBtn`), ARSkyMap zaman-yolculuÄŸu slider (`timeTravel`), ARSkyMap arama modalÄ± input, MoonPhaseCalendar slider (`moonSlider.title`), LPM opaklÄ±k slider (`lightPollutionMap.opacity`).
  - HourlyCloudChart sÃ¼tunlarÄ± `div`â†’gerÃ§ek `button`: klavye odaÄŸÄ± (onFocus/onBlur) hover davranÄ±ÅŸÄ±yla aynÄ± detay paneli, `aria-pressed`, Ã§ubuk baÅŸÄ±na okunabilir ad (`saat â€” Bulut %X`).
- **F5.6** i18n saÄŸlamlÄ±k:
  - Parite testleri (`i18nIntegrity.test.ts` +3): ana katalog 8 dil anahtar-yolu kÃ¼mesi birebir (`flattenKeys` aÄŸaÃ§ dÃ¼zleÅŸtirmesi), `i18nExtra` flat katmanÄ± anahtar/boÅŸ-olmayan-deÄŸer paritesi, `compass.*` 8 dilde doluluk.
  - Pusula kÄ±saltmalarÄ± katalog: worker-safe `utils/compass.ts` (`COMPASS_CODES` kanonik Nâ€¦NW + `compassIndexForAzimuth` + `canonicalCompassCode` â€” saf hesap, worker bundle temiz) + ana-thread `utils/compassLabels.ts` (`localizeCompassCode`/`getCompassLabels`/`getCompassDirection` â€” bilinmeyen kodu Ã¶ylece dÃ¶ndÃ¼rÃ¼r; t() anahtar-sÄ±zÄ±ntÄ±sÄ± yok) + `i18nExtra.ts` `compass.n/ne/e/se/s/sw/w/nw` Ã— 8 dil.
  - GÃ¶rÃ¼ntÃ¼ noktalarÄ± yerelleÅŸtirildi: CelestialObjectDetail (2 yer), TonightTargets (2 yer), ARSkyMap canvas pusula harfleri (`langRef` Ã§izim baÅŸÄ±na tek eriÅŸim), LightPollutionMap koordinat sonekleri (N/S/E/W), `astronomy.ts` Ã¼Ã§ ayrÄ± dizin yerine tek kanonik kaynak.
  - `getMoonPhase` lang yolu: ARSkyMap iki Ã§aÄŸrÄ± `langRef.current` geÃ§iriyor (Ã§izim fraction/isWaxing tÃ¼ketir; davranÄ±ÅŸ korunur) + `astronomy.test.ts` regresyon testi (en etiket + anahtar sÄ±zÄ±ntÄ± dÃ¼zeneÄŸi kapalÄ± + lang'sÄ±z TÃ¼rkÃ§e yedeÄŸi korunur).
- **QA (gÃ¼ncel):** lint **0 hata / 0 uyarÄ±** Â· `tsc --noEmit` **0** Â· test **43 dosya / 185 test** yeÅŸil Â· build âœ” (three-vendor >500 kB bilinen uyarÄ±)


### Sekizinci kod oturumu (2026-10-17/18, Faz 5 kapanışı: F5.4 + F5.3)
- **F5.4** StandardModal/BottomSheet tabanı:
  - Yeni `src/components/ui/Modal.tsx`: 4 varyant (`center`/`sheet`/`fullscreen`/`lightbox`), `aria-modal` + `aria-labelledby`/`aria-label`, ESC, dışa tıkla-kapat (`closeOnBackdrop` yalnız `sheet` varyantında varsayılan açık — eski davranışla parite), z-seviyeleri tüketicide korunur (arama z=90, kalibrasyon z=100, lightbox z=99999), Suspense-in-panel, portala çıkış-animasyon penceresi (`EXIT_MS` × varyant; `index.css` `svModal*` keyframe'leriyle senkron).
  - **Animasyon motorı kararı:** `motion/react` Modal chunk'ından çıkarıldı (ilk taslakta §6 ilk-yükleme bütçesini geriye götürüyordu) → CSS keyframe + çıkış-unmount zamanlayıcı; sonuç **Modal chunk 18.7 kB (gzip 6.4 kB)**, `motion` yalnızca lazy `LightPollutionMap` chunk'ında.
  - `useFocusTrap` refactor: test edilebilir `attachFocusTrap(doc, container, onClose)` çekirdeği + latest-ref hook (§5 inline-`onClose` churn bulgusu kapandı).
  - **Dürüst smoke-test bulgusu:** koşullu render + portal senaryosunda odak tuzağı ilk açılışta ölü kalabiliyordu (`RefObject.current` ilk koşuda null; `open` `present`'ten önce dönerken efekt yeniden koşmuyordu). Çözüm: panel DOM'u callback-ref + state ile efekt bağımlılığına verildi (`useFocusTrap(container: HTMLElement | null, active, onClose)`). Tarayıcıda günlük BottomSheet + LPM fullscreen (lazy leaflet) + gök cismi detayında doğrulandı: ilk odak = Kapat, Tab döngüsü içerikte, gerçek ESC kapanış, kilit bırakımı, exit-animasyon sonrası unmount.
- **F5.3** geri tuşu modal kaydı:
  - Yeni `src/utils/backButtonRegistry.ts`: LIFO yığın; `consumeBackButtonModal()` **pop** semantiği (push değil — sonsuz yeniden-tüketim döngüsü kapanır; registry testleriyle kilitli); `App.tsx` DOM-id sorgulama hack'i silindi.
  - `useModalBackHandler(open, onClose)`: modal tabanında tek geçişte kayıt; modal olmayan üstündüzler de kayıtlı (foto kılavuzu; kapsam-dışı küçük ek: zaman-yolculuğu paneli — dokümante).
  - `CelestialObjectDetail`: `planned` bayrağı açılışta taze okunur + `OBSERVATION_DATA_CHANGED` reaktif; tarayıcıda yeniden-açılış doğrulaması ("Bu gece planına ekle" → "Plana eklendi" disabled, storage'dan taze).
- Testler: `backButtonRegistry.test.ts` (+4), `modalScrollLock.test.ts` (+3), `useFocusTrap.test.ts` (+5) = **+12** (44→46 dosya; 185→197).
- Önceden var olan iki tsc hatası onarıldı (işlevsel değişiklik yok): `storageRepository.test.ts` `vi.fn<() => Promise<{ keys: string[] }>>()` vitest-4 imzası; `LightPollutionMap.tsx` `L.map(container, …)` guard-öncesi değişken kullanımı.
- Kabul/varsayımlar: roadmap "BehindDetail" `src`'te eşleşmedi → CelestialObjectDetail geçişi kapsıyor sayıldı; lazy LPM içeriği geç çözülürse ilk otomatik odak boşa gider (Tab/ESC çalışır — kabul edildi, §6 notu).
- **QA (güncel):** lint **0 hata / 0 uyarı** · `tsc --noEmit` **0** · test **46 dosya / 197 test** yeşil · build ✔ (three-vendor >500 kB bilinen uyarı)

### Dokuzuncu kod oturumu (2026-10-18, kurtarma + F6.1 doğrulama + F6.2 + F6.3)

**Olay — toplu-düzenleme kaynaklı 4 dosyanın bozulması ve tam kurtarılması:**
- Bozulma mekanizması doğrulandı: bir toplu düzenleme betiği `@( @(eski,yeni) )` çiftlerini
  düzleştirince `.Replace('b','g')` tüm-dosya ölçeğinde koştu; tam 4 dosya etkilendi
  (küçük-harf b sayımı: ARSkyMap 887, MeteorShowers 179, ObservationPlanner 185, ErrorBoundary 18).
- Kurtarma zinciri (kaynak yok: .git boş, editör geçmişleri boş, sourcemap yok):
  `dist_backup` webpack-paket-orakı + oturum DB'sindeki okuma-parçaları (t ≥ 1792334000000
  güvenilmez) + gövde-kelime-sıklığı sözlüğü ile DP, artık belirsizleri ayırma
  (`deambig_v2`), sonra `tsc`-yönlendirmeli onarımlar (`repair2`/`repair3`).
  DP'nin sistemik açığı: ASCII olmayan öncesindeki tek başına `g` yanlışlıkla `b`'ye
  dönmüştü (`gözlem→bözlem` ailesi) — hepsi elle listeylenip onarıldı.
- **Paket-oraklı son doğrulama (kurtarmanın kanıtı):** yeni build alınıp `dist_backup`
  ile kanonik karşılaştırıldı (chunk-hash adları + tanımlayıcı-permütasyonlar normalleştirildi):
  - `ARSkyMap` chunk: **yapı-genel birebir** — tüm string literaller ve ifade yapısı eş;
    yalnızca minifier yerel-adları kaymış (semantik-inert).
  - `index` chunk: **tam eş** (token-sıyırılmış norm eğrisi).
  - `App` chunk: yalnızca F6.1 sınıf dönüşümleri (`bg-[#0A1128]/90→bg-app-nav` ailesi)
    + ikon-alias yeniden adları.
  - `AstroEventsHub`/`NASAAPOD`/`LightPollutionMap`/`ObservationSuitability`: yalnızca
    F6.1 sınıf dönüşümleri; Meteor/Planner Türkçe stringleri (`güvenilir`, `gökyüzünü`,
    `Sabır`) pakette doğrulandı.
  - 6 adet `web-*` chunk: yalnızca CSS chunk-hash import adı.
  Başka hiçbir farklılık kalmadı — kurtarmanın paket-sertifikalı tamamlanması.
- `nightvisor` (ARSkyMap 82) olduğu gibi bırakıldı; `kabığı` doğru Türkçe'dir (yanlış-
  pozitif; değiştirilmedi). Devam eden 4 dosyalık risk giderildi; gelecekteki toplu
  düzenlemelerde scriptler düzleştirme hatasına karşı çift-yazma kontrolü içermeli.

**F6.1 — Token konsolidasyonu doğrulaması:** `index.css` `--color-app-*` seti + `:root`
`--sv-*` aynaları yerinde; yukarıdaki paket-orakı App/AstroEventsHub/NASAAPOD/LPM/
ObservationSuitability/ARSkyMap `className` dönüşümlerini bağımsız doğruladı.

**F6.2 — Standart Toast:**
- Yeni `src/store/toastStore.ts`: framework-bağımsız pub-sub (React bağımlılığı yok),
  `showToast(message, {variant: info|success|warning|danger, duration})` → `id`;
  varsayılan 3s görünürlük, `MAX_TOASTS=3` (en eski düşer), `TOAST_EXIT_MS=180`
  (`index.css` `svToastOut` ile senkron), `dismissToast`+`resetToasts`.
- Yeni `src/components/ui/Toast.tsx`: `useSyncExternalStore` + hep-mounted portal
  (`Modal.tsx` taban kuralını izler), `role="status" aria-live="polite"` (odak çalınmaz),
  F6.1 ton token'ları (`text-app-info/success/warning/danger`), `sv-toast-in/out`.
- `App.tsx`: uygulama-çapında tek `<ToastHost />` (portal target `document.body`).
- Migrasyon: `MeteorShowers.tsx` (yeniden-wait/weather uyarıları warning, alarm
  kurdurulamadı danger, kurulum success; yerel `[toastMsg, setToastMsg]` state, 3s
  zamanlayıcı ve inline markup silindi) ve `ISSTracker.tsx` (hata kanalı danger,
  kurulum success, kalkırıldı info; aynı temizlik).
- Test: `toastStore.test.ts` +7 (varsayılanlar, süre/çıkış penceresi, kapasite,
  erken kapatma, varyant geçişi, çift-tetikleme guard).
- QA: lint **0/0**, tsc **0**, test **47 dosya / 204 test** yeşil, build ✓.

**F6.3 — Mono-sayı + tip ölçeği:**
- `index.css` `body`'ye `font-variant-numeric: tabular-nums` (canlı telemetri hanede
  oynatmaz; dist CSS'te doğrulandı).
- `@theme` tip-ölçeği token'ları: `--text-2xs:10px`, `--text-3xs:9px`, `--text-4xs:8px`,
  `--text-5xs:7px`, `--text-xs-plus:11px` (varsayılan xs=12/sm=14 ezilmedi) ve 108 adet
  `text-[Npx]` sınıfı adlandırılmış adımlara taşındı (15 dosya;
  `text-[0px]` ARSkyMap a11y gizli-etiket kullanımı bilinçli dışarıda).
- QA: lint **0/0**, tsc **0**, test **47/204** yeşil, build ✓ (`text-2xs/4xs` + font-variant dist'te doğrulandı).

**Kalan (Faz 6 o güne):** F6.6 boş-durum, F6.7 count-up, F6.8 haptic, F6.9 pull-to-refresh, F6.10 meteor geri sayımı, F6++ bildirim eşiği UI. Not: F6.2 `motion`'a geri dönmez (rep perf bütçesi).

---

## 11. Oturum (2026-10-19) — F6++ + F6.9 + F6.10 kapatıldı; Faz 6'nın S-effort bloğu bitmiştir

**F6++ — Bildirim eşik ayar UI'si (§3.6 açık bulgusu kapandı):**
- `SmartNotificationSettings.tsx`: `border-t` detay bölümüne **"Uyarı eşikleri"** alt bölümü
  eklendi — (1) `cloudThreshold` için 0–100 aralığında 5 adımlı `range` slider (canlı
  değer rozeti `notifications.cloudThresholdValue` — TR'de `%30`, EN'de `30%`, AR'da `٪`),
  (2) `kpThreshold` için Kp 3–9 `select` (`KP_MODERATE_INDEX`'ten türetilen
  `KP_THRESHOLD_OPTIONS`; varsayılan 5 = `DEFAULT_KP_ALERT_THRESHOLD`).
- Slider-debounce: sürekli `onChange` her seferinde yazma-kuyruğu + native sync üretmesin
  diye 350 ms bekleme penceresi (`cloudCommitRef`); unmount'ta bekleyen zamanlayıcı
  iptal edilip son değer `saveNotificationPreferences` ile kalıcı kılınır (native sync
  App açılışında zaten yeniden kurulur). Kp select anında `update()` + `selectionHaptic`.
- Kayıt/kancalar zaten hazırdı: `saveNotificationPreferences` zod şeması + Java
  `BackgroundAlertWorker`'ın `cloudThreshold/kpThreshold` prefs'i — sadece UI eksikti;
  `syncBackgroundAlerts` eşik değişiminde tetiklenir (Android-only, `...preferences`).
- i18n: 8 dilde yeni 7 anahtar (`notifications.thresholdsTitle/cloudThresholdLabel/
  cloudThresholdDesc/cloudThresholdValue/kpThresholdLabel/kpThresholdDesc/kpValue`) +
  `clearDesc/auroraDesc` metinleri "uygulama eşiği/app threshold" → "belirlediğin eşik"
  user-threshold dili olarak 8 dilde güncellendi (parite testleri yeşil).
- **Tarayıcıda doğrulandı:** profil → bildirimler; slider %45'e çekildi → localStorage
  `cloudThreshold: 45` debounced commit ✓; Kp 4 seçildi → `kpThreshold: 4` ✓; test
  değerleri sonra varsayılana (30/5) geri alındı. a11y: `htmlFor/id` + `aria-describedby`.

**F6.9 — Pull-to-refresh (hava):**
- Yeni `hooks/usePullToRefresh.ts`: yalnızca **dokunma** jestleri (masaüstü fare
  seçimi bozulmaz), yalnızca kaydırma konteyneri tepedeyken (`scrollTop <= 0`) ve
  aşağı-dominan harekette jest "talep edilir" — `touchmove` non-passive
  `preventDefault` ile yerel kaydırma engellenir; yoksa normal kaydırma hiç
  dokunulmaz. Kaydırarak yukarı gelen parmak için başlangıç noktası sürekli yeniden
  demirlenir (tepede ani devPull birikmez — yanlış tetik yok). Damping `dy*0.55`,
  threshold 72 px, `onRefresh` latest-ref (F5.4 kuralı), eşik aşımında `selectionHaptic`.
- `App.tsx`: callback-ref state (`setMainContainer`) + `{ pullDistance, isRefreshing }`;
  indikatör: `sticky top-0` ortalanmış pill, çekimde opacity = `pullDistance/40`
  (metinsiz ikon), gerçek yenilemede `RefreshCw animate-spin` +
  `role="status"` + 8 dilde `refresh.inProgress` ("Yenileniyor…").
- `refetchWeather()` react-query refetch (staleTime bypass) — yalnızca hava sorgusu;
  hata yüzeyi OfflineStatusBanner/ekran hata kanalları.
- **Tarayıcıda doğrulandı:** synthetic TouchEvent üçlüsü — eşiğin altında çekimde
  indikatör pill + ikon görünürlüğü ✓; eşiği aşınca hava refetch tetiklendi:
  `weather_cache_*` timestamp ilerledi + freshness "Şimdi güncellendi" ✓; refresh
  bitince indikatör DOM'dan kalktı ✓. Bırakımda sıfırlama ✓.

**F6.10 — Meteor geri sayım + takvim bugün:**
- Saf yardımcı `utils/dateTime.ts` `formatCountdownToInstant(now, target, units)`:
  <1 sa → dakika; <48 sa → "7 sa 20 dk" (sıfır dakika kırpılır); ≥48 sa → "3 gün 6 sa"
  (sıfır saat kırpılır); geçmiş hedef → `null`. Dakika-tanesiyle sınırlı — ekranlar
  `observer.instant` (dakikalık, görünürlük-kapılı tick) ile yeniden-render ettiği için
  saniye-tikleyicisi gerekmez (F3.1 disiplini korunur).
- `MeteorShowers.tsx`: panel başlığının altına amber **hero geri sayım** ("Sonraki
  zirve / Orionid · 2 gün 12 sa") — `upcoming[0] ?? nextYearPreview[0]`; `role="status"`,
  `Timer` ikonu, `tabular-nums` (F6.3). Geri sayım birim sözlükleri bileşen-lokal
  Record (dosyanın mevcut `daysToPeak/alarmFailureMessage` deseniyle tutarlı).
- `MoonPhaseCalendar.tsx`: bugün hücresi 15'lik sayfa bölümünün dışında kalırsa (ayın
  ikinci yarısı) ilk açılış/ay değişiminde `todayCellRef` hücresi
  `scrollIntoView({block:'nearest', inline:'center'})` ile bulunduğu sayfaya alınır —
  bugün zaten nokta-stiliyle işaretliydi ama ekranda olmayabilirdi.
- Test: `dateTime.test.ts` +4 (geçmiş→null, dakika, saat+dakika, gün+saat/kırpımlar).
- **Tarayıcıda doğrulandı:** "Sonraki zirve: Orionid · 2 gün 12 sa" (London TZ bugünü
  18 Ekim 23:49 → zirve 21 Ekim 12:00 — tutarlı); Ay takvimi ilk açılışta
  `scrollLeft: 705` ile bugünün sayfasına gitti, bugün hücresi görünür + 1 adet
  `bg-indigo-500` bugün-noktası ✓.

**QA:** lint **0/0**, tsc **0**, test **49 dosya / 218 test** yeşil, build ✓ (bilinen
`three-vendor >500 kB` uyarısı; `App` chunk ~+2 kb — usePullToRefresh + indikatör).

**Kalan (Faz 6):** yalnız **F6.4** (AR HUD şeridi, M) ve **F6.5** (gün özeti hero, M) —
kod kalem fazlar buna yakın bitiş. Kritik açık yine §C cihaz günü (F2.4).

## 12. Oturum (2026-10-19) - F6.4 + F6.5 kapandı; Faz 6 TAMAM — kalan kod işi yok

**F6.4 - AR HUD şeridi (FOV/azimut/kalite cam-pill):**
- Yeni `features/sky-map/ArHudStrip.tsx`: AR açıkken üst-ortada pointer-events-none
  cam-pill şerit - (1) takip-kalitesinde nokta + `productT('ar.quality*')` etiketi
  (good=emerald/fair=amber/poor=rose), (2) canlı azimut (sayı + derece işareti),
  (3) `FOV {effectiveHorizontalFov}°`. `max-w-[70vw]` + `backdrop-blur-md` +
  `bg-slate-950/70` - mevcut komut çubuğu cam diliyle uyumlu.
- **Azimut akışı imperatif**: kare-döngüsü (`render`) yalnızca `Math.round(heading)`
  değeri değiştiğinde `hudHeadingTextRef` span'ının `textContent`'ini yazar; React
  state/re-render üretilmez (F3.3 kare-döngüsü ayrım kuralı). `lastHudHeadingDeg`
  closure değişkeni DOM churn olmadan canlı akış sağlar.
- Saf çekirdek: `arCameraModel.ts` `computeCameraTrueHeadingDeg(nativeMatrix, alpha,
  declination, manualOffset)` - native matris dalı, radar hedefleme matematiğindeki
  merkez-eksen `atan2(-r13,-r23)` formülünün true-çerçeveye ters dönüşümüdür
  (`tracking + declination + offset`); dikey-eksen (r13/r23≈0) veya matris yoksa
  `normalizeAzimuth(alpha + offset)` fallback'i (web sensör yolu). +4 altın test
  (`arCameraModel.test.ts`): 30°+4.5+2.5 altın değer, 0/360 sarma +
  `convertTrueToTrackingAzimuth` geri-dönüşüm tutarlılığı, dikey-eksen fallback
  (405°→45°), null yol (-10°→350°).
- `ARSkyMap.tsx`: `hudHeadingTextRef` ref'i + kare-döngüsü HUD yazım bloğu
  (screen-angle bertarafından sonra, matrix hesaplarının hemen ardından);
  komut çubuğu eski FOV pill'i silindi (FOV tek kaynak = HUD şerit).
- i18n: **sıfır yeni anahtar** (`getArTranslation('azimuth')` + mevcut `ar.quality*`).

**F6.5 - Gün özeti hero (`TodayDashboard.tsx`):**
- Yüzey: `sv-hero` (yeni `index.css` token katmanı: `--sv-surface-raised`
  üzerine 2 radyal sky parıltısı (info/accent tonları); `--sv-border` +
  `--sv-radius-panel` kotları; night-mode beyaz-listesine eklendi).
- Skor **SVG halkası** (`r=42`, `stroke-dasharray/offset`, -90° rotasyon) +
  **F6.7 `useCountUp`** (ilk mount'ta animasyon yok; yükleme sırasında hedef 0 →
  halka boş + sayı `--`; reduced-motion snap; veri gelince 0'dan skora döner). Ton:
  ≥70 emerald / ≥40 amber / <40 rose.
- Toggle semantiği korundu: halka tıklaması `aria-expanded` + `aria-controls=
  "observation-score-details"` taşır; `ScoreExplanationPanel` aynı id ile hero
  içinde açılır/kapanır + `selectionHaptic()` (F6.8 sözleşmesi: toggle→selection).
  "Neden?" ipucu halka etiketi yanında: `GÖZLEM SKORU · ⓘ BU SKOR NEDEN?`.
- Karanlık pencere sağ kolon: `today.darkWindow` etiket + `Clock3` + `timeRange` -
  uyarı/önerilen hedef bant aynen korundu; `DataFreshness`, konum kaynağı, fieldMode
  düğmesi değişmedi.
- i18n: **sıfır yeni anahtar** (`today.*` + `scoreT('why')` yeniden kullanımı).
- `Panel` (`sv-panel`) yerine ham `<section className="sv-hero">` - `Surface.tsx`
  değişmedi (Panel diğer ekranlarda aynen kullanılır).

**QA:** lint **0/0**, tsc **0**, test **49 dosya / 222 test** yeşil (+4: 
`computeCameraTrueHeadingDeg`), build ✔ (bilinen `three-vendor >500 kB` uyarısı).

**Tarayıcıda doğrulama:**
- F6.5: skor halkası 20/100 + "GÖZLEM SKORU · BU SKOR NEDEN?" etiketi + karanlık
  pencere dilleri; ring-tık → ayrıntı paneli açıldı (expanded=true +
  "Skor ayrıntıları" bölge), tekrar-tık → kapandı (expanded=false) - a11y zinciri ✔.
- F6.4: bu masaüstü ortamda kamera yok (Chrome izin reddi — dost hata yolu çalıştı,
  `arMode` doğru geri alındı); HUD yalnızca AR modunda render edilir ve **görsel
  doğrulaması §C.5 cihaz gününe** kaldı (mantık + altın testler yeşil).
  Konsol: yalnızca beklenen `Camera stream startup failed: NotAllowedError`.

**Kalan:** kod işi **YOK**; kritik açık **§C cihaz günü (F2.4)** - C.5/§C.1-C.11 +
F6.4 HUD görsel kontrol. Cihaz sonrası olası tek kod oturumu: F2.4 eksen
negatifleme düzeltmesi (ölçüme bağlı).