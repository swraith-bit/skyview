# Skyview — Modern UI/UX Vizyonu ve Öneri Yol Haritası

> **Durum:** Öneri belgesi — henüz uygulanacak kapsam veya teknik görev listesi değildir.  
> **Tarih:** 19 Ekim 2026  
> **Ürün:** Android öncelikli, React + Capacitor tabanlı astronomi ve uzay gözlem uygulaması.

## 1. Amaç ve mevcut durum

Skyview bugün yalnızca bir gökyüzü kataloğu değil; günlük gözlem skoru ve karanlık pencere, saatlik hava/gözlem uygunluğu, gece hedefleri, gözlem planı, saha/gece modu, AR gökyüzü haritası, Ay ve meteor takvimi, ISS/uydu takibi, ışık kirliliği haritası ve NASA APOD gibi işlevleri bir araya getiriyor. Projede tasarım tokenları, modal ailesi, boş durumlar, bildirim eşikleri, erişilebilirlik iyileştirmeleri, AR HUD ve ana sayfa özeti gibi bir modernizasyon turu da tamamlanmış durumda.

Bu nedenle önerilen bir sonraki büyük adım, mevcut arayüzü baştan boyamak değil; **bu güçlü araç setini kullanıcının gerçek gözlem yolculuğu çevresinde daha anlaşılır, yönlendirici ve sahada daha güvenilir hale getirmek** olmalı. Öncelik; “Bu gece ne gözlemleyebilirim, ne zaman ve nasıl hazırlanırım?” sorusunu az adımla cevaplamak.

## 2. Ürün deneyimi vizyonu

**Skyview, gökyüzünü yalnızca gösteren değil, kullanıcıyı iyi bir gözlem oturumuna hazırlayan ve oturum boyunca yanında olan kişisel astronomi rehberi olsun.**

Önerilen ana kullanıcı akışı:

1. **Durumu anla:** Konum, saat, hava, Ay/karanlık durumu ve veri tazeliği.
2. **Karar ver:** Bu geceki en iyi zaman aralığı ve koşullara uygun hedefler.
3. **Hazırlan:** Hedef sırası, ekipman/notlar, konum ve bildirimler.
4. **Sahaya çık:** Kırmızı ışık, tek elle kullanım, AR yönlendirmesi ve çevrimdışı dayanıklılık.
5. **Hatırla ve geliştir:** Oturum notu, görülen hedefler ve bir sonraki gözlem için süreklilik.

Her ekranın bu akıştaki bir sonraki yararlı adımı belirginleştirmesi hedeflenmeli; yeni özellik eklemek tek başına başarı sayılmamalı.

## 3. Tasarım ilkeleri

- **Görev odaklılık:** Modül adlarını ve veri kartlarını, kullanıcı niyetine (“Bu geceyi planla”, “Gökyüzünde bul”, “Geçişi takip et”) bağlayın.
- **Önce güven ve açıklık:** Hava, skor, tahmin ve astronomik olaylarda veri kaynağı/tazeliği, yaklaşık değer ve belirsizlik açıkça gösterilsin. Skorun nedeni kolay anlaşılır olsun.
- **Sahada okunabilirlik:** Gece modu ve kırmızı ışık korunurken yazı/ikon kontrastı, büyük dokunma hedefleri, tek elle erişim ve güneş altında okunabilirlik cihaz üzerinde sınansın.
- **Sakin görsel hiyerarşi:** Her karta aynı ağırlığı vermeyin. Bir ana karar, bir sonraki eylem ve ikincil ayrıntılar arasında net öncelik kurun.
- **Kademeli açıklama:** Yeni başlayanlara kısa açıklama ve basit varsayılanlar; ileri kullanıcılara ayrıntılı parametreler ve katmanlar.
- **Dürüst ve dayanıklı deneyim:** GPS/kamera izni verilmediğinde, çevrimdışıyken veya veri eskidiğinde boş ekran yerine durumu açıklayan alternatif yol sunun.
- **Dahil edici tasarım:** Mevcut sekiz dil, Arapça RTL, ekran okuyucu, klavye/harici kontrol, reduced-motion ve renk körlüğü senaryoları tasarımın parçası olsun.
- **Ölçülü animasyon:** Hareket sadece durum ve yön hissini güçlendirsin; saha kullanımında dikkat dağıtmasın ve pil/GPU maliyeti yaratmasın.

## 4. Önerilen UI/UX fikirleri

### A. “Bu Gece”yi karar merkezine dönüştürün

Bugünkü gösterge panelindeki skor, karanlık pencere, ana uyarı, hedefler ve zaman çizelgesi zaten iyi bir temel. Bir sonraki tasarım turunda bu parçaları daha tutarlı bir **gece özeti** etrafında birleştirin:

- Üstte küçük bir bağlam satırı: **konum · yerel saat · veri tazeliği · konum kaynağı**; konum değiştirme/konumu doğrulama kolay erişilebilir olsun.
- Birincil kart: “En iyi gözlem aralığın” ve nedenleri. Yalnızca tek skor yerine bulut, Ay ışığı/karanlık, rüzgâr ve ışık kirliliği etkileri kısa, karşılaştırılabilir göstergelerle açıklansın.
- Zaman çizelgesinde uygun saat dilimleri dokunulabilir olsun; seçilen saat, o saatte görülebilecek hedefleri ve gerekirse plan önerisini güncellesin.
- Hedef kartlarında zorluk/seviye, tahmini görünürlük, önerilen araç (çıplak göz/dürbün/teleskop) ve “Gökyüzünde bul” gibi net bir sonraki eylem bulunsun.
- Koşullar elverişsizse yalnızca olumsuz uyarı vermeyin: daha iyi saat, daha parlak hedef veya APOD/öğrenme içeriği gibi alternatif önerin.

**Tasarım sorusu:** Mevcut “Bugün” ve “Gökyüzü” alanları arasında hangi içerik gerçekten karar vermeye yardım ediyor? Kullanıcı testiyle belirleyin; ana sayfayı kartlarla daha da uzatmayın.

### B. Gezinmeyi araç listesinden niyetlere yaklaştırın

Mobildeki dört ana alanı (Bugün, Gökyüzü, Planla, Profil) başlangıçta koruyun; dört sekme başparmak erişimi ve mevcut derin bağlantılar için sağlam bir temel. Ancak “Gökyüzü” altındaki hedef, AR, ISS, uydular ve APOD gibi araçların bulunabilirliği test edilmeli.

- “Gökyüzü” girişini salt araç listesi yerine **Keşfet / Gözlemle** gibi iki basit girişe ayırmayı prototipte deneyin: gök cismi/olay keşfi ve canlı saha araçları.
- AR, ISS ve uydu gibi sık kullanılan eylemlere, uygun bağlamlarda (gece özeti, hedef ayrıntısı, plan) kısa yol verin; yeni bir alt menü yığını kurmayın.
- Sekme içi alt gezinmeyi yatay, küçük ve çok sayıda düğme gerektiren bir modele dönüştürmeden önce 5–7 kullanıcıyla kart-sıralama veya görev testi yapın.
- “Profil” içinde tercih/ayarlar ile kişisel gözlem geçmişi ileride ayrışırsa, navigasyon kararı kullanım kanıtına dayansın; şimdiden yeni bir sekme eklemeyin.

### C. Planlamayı gerçek bir gözlem oturumu akışına bağlayın

Planlama ekranını yalnızca kayıt listesi değil, bir oturum hazırlama alanı olarak ele alın:

- Akıllı başlangıç: tarih/saat, konum ve uygunluk aralığı varsayılan dolsun; kullanıcı her seferinde aynı bilgileri tekrar girmesin.
- Hedef sırası: hedefleri sürükle-bırak veya basit yukarı/aşağı kontrolleriyle düzenleyin; her hedefin yanına görünürlük zamanı ve zorluk ekleyin.
- Sahaya çıkış kontrol listesi: isteğe bağlı ekipman, pil, kıyafet, kırmızı ışık gibi kullanıcı tarafından düzenlenebilir maddeler.
- Plan kartında belirgin tek eylem: “Oturumu başlat”; başlatınca uygulama ilgili saha/AR/hedef rehberliğine geçsin.
- Oturum sonunda kısa kayıt: görülen hedef, not, isteğe bağlı fotoğraf/puan. Geçmişi zorunlu sosyal paylaşım veya hesap kurulumuna bağlamayın.

### D. Saha/AR deneyiminde kontrolü ve güveni artırın

AR HUD ve saha modu mevcut temel üzerine geliştirilerek gözlemde göz yormayan, dikkat dağıtmayan bir **saha çalışma alanı** oluşturabilir:

- Kullanıcı ekranı açmadan önce izin, sensör/kamera, pusula kalibrasyonu ve konum durumunu kısa bir hazırlık kontrolünde görsün; “neden çalışmıyor?” sorusu için doğrudan çözüm sunulsun.
- Sık kullanılan kontroller (katman, görüş alanı, hedefe kilitlenme, pusula/kalibrasyon) tek elle erişilebilir ve yanlış dokunmaya dayanıklı olsun; ikincil kontroller gerektiğinde saklansın.
- Hedefe yönlendirme; ok, yön farkı, yükseklik/azimut ve takip kalitesini birlikte ama sade biçimde anlatsın. Sensör kalitesi düşerse arayüz bunu açıkça söylesin; sahte kesinlik vermesin.
- Kırmızı gece görünümü, uygulamanın tüm yüzeylerinde tutarlı olsun; parlak modal, harita kontrolü veya bildirim gece görüşünü bozmasın.
- İnternet olmadan hangi bilgilerin devam edeceği (önbellekteki plan/konum/harita vb.) tasarım içinde anlaşılır olsun.
- AR projeksiyonunun yön doğruluğu ve HUD görünümü önce gerçek Android cihazlarında doğrulansın; mevcut teknik yol haritasındaki cihaz testleri bu konuda kapı kriteridir.

### E. Tasarım sistemi ve bileşen dilini tutarlılaştırın

Mevcut token, modal, Toast, boş durum, tipografi ve durum bileşenlerini koruyup ürün genelinde kullanım kurallarını belirginleştirin:

- Kart yoğunluğu için standart: birincil özet, ölçüm/istatistik, eylem kartı ve ikincil ayrıntı farklı görsel rollere sahip olsun.
- Durum ailesi: yükleniyor, güncel, eski/önbellek, çevrimdışı, izin gerekli, veri yok ve hata görsel/işitsel olarak tutarlı olsun.
- Renk anlamı tek olsun: olumlu/uygun, dikkat, hata ve nötr; yalnızca renk ile anlam aktarılmasın.
- Tipografide sayı hizası, astronomik ölçü birimleri ve yerelleştirilmiş tarih/saat biçimleri tutarlı olsun.
- İçerik şablonları tüm dillerde taşma, uzun metin ve RTL açısından sınansın; Türkçe/İngilizce görünümü bütün diller için vekil kabul etmeyin.
- Cam/blur, parıltı ve geçişler dekoratif amaçla yaygınlaştırılmasın; düşük güçlü cihazda okunabilirlik ve performans öncelikli olsun.

### F. Kişiselleştirme ve süreklilik

Kullanıcı, deneyimi teknik bilgi seviyesine ve gözlem biçimine göre ayarlayabilsin:

- Başlangıçta isteğe bağlı “Yeni başlıyorum / deneyimliyim” profili; yalnızca açıklama ayrıntısını ve hedef önerilerini etkilesin.
- Çıplak göz, dürbün, teleskop veya astrofotoğrafçılık niyetine göre filtrelenebilir hedefler.
- Favori konum/karanlık alan, son kullanılan hedefler ve özel bildirim tercihleri.
- Oturum notları ve geçmiş, yerel ve mahremiyet öncelikli biçimde çalışsın; bulut eşitleme ileride istenirse ayrı karar olsun.

Bu başlıklar keşif/prototip fikirleridir; ilk sürüme hepsini eklemek zorunlu değildir.

## 5. Önerilen yol haritası

Aşağıdaki eforlar yalnızca kaba ürün/tasarım tahminidir; takvim taahhüdü, onaylı kapsam veya mevcut teknik `ROADMAP.md` dosyasının yerine geçmez. Önceki fazın test/karar kapısı geçilmeden sonraki faza başlanmaması önerilir.

| Faz | Odak | Ana çıktılar | Başarı / karar kapısı | Yaklaşık efor |
|---|---|---|---|---|
| **0 — Keşif ve baz ölçümü** | Mevcut akışı anlamak | 5–7 Android kullanıcısıyla kısa görev testleri; yeni/ileri kullanıcı ayrımı; Bugün → hedef → plan → AR görevlerinin ekran kaydı/notları; performans ve saha senaryosu kontrol listesi | Kullanıcıların takıldığı ilk 3 nokta ve temel metrikler net; mevcut özelliklerle tekrar eden/az kullanılan alanlar belirlenmiş | **S** |
| **1 — Bilgi mimarisi ve etkileşim prototipi** | İçeriği niyete göre düzenlemek | Bugün/Gökyüzü/Planla/Profil için akış haritası; sekmeler ve kısayolların kağıt/Figma prototipi; gece özeti varyantları; boş/çevrimdışı/izin durumları | Temel görevler kullanıcı testlerinde navigasyon yardımı olmadan tamamlanıyor; yeni sekme veya büyük bilgi mimarisi değişikliği kanıtla onaylanıyor | **M** |
| **2 — “Bu Gece” karar deneyimi** | Tahminden eyleme | Birincil gözlem penceresi, açıklanabilir koşullar, seçilebilir saat dilimleri, hedef kartı eylemleri ve elverişsiz hava alternatifleri prototipi/uygulaması | “Bu gece ne gözlemleyebilirim?” görevi daha az adımda tamamlanıyor; skorun ne anlama geldiği anlaşılıyor; eski veri yanlışlıkla güncel sanılmıyor | **M–L** |
| **3 — Saha modu ve AR akışı** | Açık havada güvenli/kullanışlı kullanım | İzin-kalibrasyon başlangıç kontrolü, sade saha kontrol düzeni, gece görünümü, hedefe yönelme etkileşimi ve offline durum tasarımı | En az iki gerçek Android cihazında yön doğruluğu, tek elle erişim, okunabilirlik, geri tuşu/modal ve kamera izin akışları başarılı | **L** |
| **4 — Plan → oturum → günlük** | Ürün içinde süreklilik | Hedef sırası, hazırlık listesi, oturum başlatma ve isteğe bağlı gözlem günlüğü akışları; yerel saklama ve düzenleme kuralları | Kullanıcı planını sahada bulup tamamlayabiliyor; oturum sonu kayıt isteğe bağlı ve kısa; veriler uygulama yeniden açılınca korunuyor | **M–L** |
| **5 — Tutarlılık, erişilebilirlik ve kalite** | Tüm deneyimi bitirmek | Durum ailesi, kart yoğunluğu, çok dilli/RTL görsel QA, TalkBack/kontrast/reduced-motion testi, düşük performanslı cihaz testi ve UX ölçüm panosu | Kritik akışlarda bloklayıcı a11y/yerelleştirme hatası yok; açılış/etkileşim performansı gerilemiyor; metrikler mahremiyet ilkesine uygun | **M** |

### Faz 0 için önerilen araştırma görevleri

Katılımcılardan aşağıdaki işleri uygulamada yardım almadan yapmalarını isteyin:

1. Bu gece gözlem için en uygun zamanı bulun ve nedenini açıklayın.
2. Şu anki koşullara uygun bir hedef seçin; hedefin nerede/ne zaman görüneceğini bulun.
3. Bir gözlem planı oluşturun ve sahaya hazırlanmak için gereken bilgiyi bulun.
4. AR ile seçilen hedefi gökyüzünde bulmayı deneyin; kamera/konum izni veya sensör sorunu çıktığında ilerleyebilin.
5. İnternet bağlantısı kapalıyken hangi bilgilerin kullanılabildiğini ve verinin güncelliğini anlayın.

## 6. Başarı ölçümü önerileri

Ölçüm eklemeden önce temel değerleri ve kullanıcı mahremiyetini değerlendirin. Konumun kesin koordinatlarını analitik olaylarına göndermeyin; mümkünse toplulaştırılmış veya cihaz içinde hesaplanan ölçüler kullanın.

- **Görev başarısı:** “uygun saat bulma”, “hedefi seçme”, “planı başlatma” başarı oranı ve tamamlama süresi.
- **Keşfedilebilirlik:** Kullanıcının hedef/AR/ISS araçlarını yardım almadan bulabilme oranı.
- **Açıklanabilirlik:** Gözlem skorunu ve veri tazeliğini doğru yorumlayabilen kullanıcı oranı.
- **Saha dayanıklılığı:** İzin/kalibrasyon hatasından kurtulma, çevrimdışı senaryoda görev tamamlama, yanlışlıkla moddan çıkma oranı.
- **Erişilebilirlik ve kalite:** 8 dilde taşma/RTL bulguları, TalkBack görev testleri, gerçek cihazlarda düşük FPS veya uzun yüklenme gibi gözlenen sorunlar.
- **Süreklilik:** Planlanan oturumun başlatılması ve isteğe bağlı günlük kaydı kullanımı; yalnızca ürün kararına yardımcı olacaksa izlenmeli.

Başarı hedeflerinin sayısal eşikleri Faz 0 baz ölçümü ve kullanıcı araştırmasından sonra belirlenmeli; önceden keyfi hedef konmamalı.

## 7. Kapsam dışı / erken karar verilmemesi gerekenler

- Sırf “modern görünsün” diye mevcut koyu/astronomi görsel kimliğini sıfırlamak.
- Kullanıcı testi olmadan alt navigasyona yeni sekme eklemek veya tüm ekranları yeniden gruplayıp derin bağlantıları kırmak.
- İlk turda sosyal ağ, hesap zorunluluğu, bulut senkronizasyonu veya ücretli katman tasarlamak.
- Gerçek cihazda doğrulamadan AR yön/kalibrasyon arayüzünü yeniden yazmak.
- Güvenilir veri kaynağı, ürün kararı ve bakım sahibi belli olmadan yeni büyük veri/AI özelliği eklemek.
- Animasyon, 3B ve görsel efektleri performans/erişilebilirlik ölçümünden önce artırmak.

## 8. Uygulamaya geçmeden önce alınacak kararlar

1. Birincil kullanıcı: yeni başlayan gözlemci mi, amatör astronom mu, yoksa ikisi için kademeli deneyim mi?
2. En değerli ana görev: gece planlamak mı, gökyüzünde nesne bulmak mı, canlı uydu/olay takibi mi?
3. “Günlük” ve oturum geçmişi ilk büyük tasarım fazının parçası mı, yoksa sonraki sürüm mü?
4. Tasarım prototipi hangi araçta hazırlanacak ve Android cihaz testini kim/kaç cihazla yapacak?
5. Faz 0’da kullanılacak başarı metrikleri ve anonim/mahremiyet korumalı ölçüm yöntemi nedir?

## 9. Önerilen ilk adım

Önce kod değişikliği yapmadan **Faz 0 görev testini** ve üç kısa prototip yönünü hazırlayın:

- **A — Tonight-first:** “Bu Gece” karar merkezli ana sayfa.
- **B — Observe-first:** saha/AR ve hedefe yönelme eylemini öne çıkaran ana giriş.
- **C — Adaptive:** yeni başlayan için yönlendirici, ileri kullanıcı için yoğunluğu ayarlanabilir görünüm.

Bu üç yönü aynı görevlerle karşılaştırın. Kullanıcıların doğru ve güvenli şekilde gözlem oturumuna en hızlı ulaşmasını sağlayan yaklaşım, sonraki tasarım/uygulama kapsamının temelini oluştursun.

---

**Not:** Bu belge, depodaki mevcut `ROADMAP.md` ve `AUDIT_REPORT.md` içinde belirtilen modernizasyonun tamamlandığı ve kalan teknik doğrulamaların ayrı olduğu bilgisi dikkate alınarak hazırlanmış bir **ürün deneyimi önerisidir**. Uygulama, kod değişikliği veya mevcut yol haritasını değiştirme yapılmamıştır.
