import { LangCode } from '../i18n';

export const celestialDescriptions: Record<string, Record<string, string>> = {
 polaris: {
 en: "The North Star. It remains nearly stationary in the sky while the entire northern sky rotates around it, making it essential for navigation.",
 tr: "Kutup Yıldızı. Tüm kuzey gökyüzü etrafında dönerken kendisi sabit kalır, bu yüzden tarih boyunca yön bulmak için kullanılmıştır.",
 de: "Der Polarstern. Er bleibt fast stationär am Himmel, während sich der gesamte Nordhimmel um ihn dreht.",
 fr: "L'étoile Polaire. Elle reste presque stationnaire dans le ciel tandis que tout le ciel du nord tourne autour d'elle.",
 es: "La Estrella Polar. Permanece casi inmóvil en el cielo mientras todo el cielo del norte gira a su alrededor.",
 ar: "نجم القطب. يبقى ثابتاً تقريباً في السماء بينما يدور حوله السماء الشمالية بأكملها.",
 it: "La Stella Polare. Rimane quasi stazionaria nel cielo mentre l'intero cielo settentrionale ruota attorno ad essa.",
 pt: "A Estrela do Norte (Polaris). Permanece quase imóvel no céu enquanto todo o céu do norte gira ao seu redor."
 },
 sirius: {
 en: "The brightest star in the night sky. Also known as the Dog Star, it is part of the Canis Major constellation.",
 tr: "Gece gökyüzünün en parlak yıldızı. Büyük Köpek Takımyıldızı'nın bir parçasıdır ve Akyıldız olarak da bilinir.",
 de: "Sirius. Der hellste Stern am Nachthimmel, auch als Hundsstern bekannt.",
 fr: "Sirius. L'étoile la plus brillante du ciel nocturne, également connue sous le nom d'Étoile du Chien.",
 es: "Sirius. La estrella más brillante del cielo nocturno, también conocida como la Estrella del Perro.",
 ar: "الشعرى اليمانية. ألمع نجم في السماء ليلاً، والمعروف أيضاً باسم نجم الكلب.",
 it: "Sirio. La stella più luminosa del cielo notturno, nota anche come Stella del Cane.",
 pt: "Sirius. A estrela mais brilhante no céu noturno, também conhecida como a Estrela do Cão."
 },
 canopus: {
 en: "The second brightest star in the night sky. Situated in the southern constellation Carina, used heavily in space navigation.",
 tr: "Gece gökyüzünün en parlak ikinci yıldızı. Güney yarımküredeki Carina (Karina) takımyıldızında yer alır ve uzay araçlarında yön bulma referansıdır.",
 de: "Kanopus. Der zweithellste Stern am Nachthimmel, im südlichen Sternbild Kiel des Schiffs gelegen.",
 fr: "Canopus. La deuxième étoile la plus brillante du ciel nocturne, située dans la constellation australe de la Carène.",
 es: "Canopo. La segunda estrella más brillante del cielo nocturno, en la constelación de Carina.",
 ar: "سهيل. ثاني ألمع نجم في السماء ليلاً، ويقع في كوكبة القاعدة الجنوبية.",
 it: "Canopo. La seconda stella più luminosa del cielo notturno, situata nella costellazione australe della Carena.",
 pt: "Canopus. A segunda estrela mais brilhante no céu noturno, localizada na constelação austral de Carina."
 },
 vega: {
 en: "A beautiful bluish-white star. It is the fifth brightest star and is part of the Lyra constellation, serving as a zero baseline for magnitude.",
 tr: "Mavi-beyaz renkli çok parlak bir yıldız. Gökyüzünün 5. en parlak yıldızıdır ve Çalgı (Lyra) takımyıldızında yer alır.",
 de: "Wega. Ein schöner bläulich-weißer Stern im Sternbild Leier, der als Nullpunkt für die Magnitudenskala dient.",
 fr: "Véga. Une belle étoile blanc-bleuâtre de la constellation de la Lyre, servant de référence zéro pour la magnitude.",
 es: "Vega. Una hermosa estrella blanco-azulada en la constelación de Lyra, que sirve de referencia cero para la magnitud.",
 ar: "النسر الواقع. نجم أزرق-أبيض جميل في كوكبة القيثارة، ويعد المرجع الصفري للمعان النجوم.",
 it: "Vega. Una splendida stella bianco-azzurra nella costellazione della Lira, utilizzata come riferimento zero per la magnitudine.",
 pt: "Vega. Uma linda estrela branco-azulada na constelação de Lyra, servindo como referência zero para magnitude."
 },
 capella: {
 en: "A bright golden star system in the Auriga constellation. It is actually a system of four stars orbiting in pairs.",
 tr: "Arabacı takımyıldızında yer alan altın sarısı parlak yıldız sistemi. Aslında birbirinin etrafında dönen dörtlü bir yıldız sistemidir.",
 de: "Capella. Ein helles goldenes Sternsystem im Sternbild Fuhrmann, das aus vier Sternen besteht.",
 fr: "Capella. Un système stellaire doré brillant dans la constellation du Cocher, composé en réalité de quatre étoiles.",
 es: "Capella. Un sistema estelar dorado y brillante en la constelación de Auriga, compuesto de cuatro estrellas.",
 ar: "العيوق. نظام نجمي ذهبي لامع في كوكبة ممسك الأعنة، وهو عبارة عن أربعة نجوم.",
 it: "Capella. Un luminoso sistema stellare dorato nella costellazione dell'Auriga, composto in realtà da quattro stelle.",
 pt: "Capella. Um sistema estelar dourado brilhante na constelação de Auriga, composto na verdade por quatro estrelas."
 },
 rigel: {
 en: "A blue supergiant star in Orion. It is extremely hot and luminous, shining thousands of times brighter than our Sun.",
 tr: "Avcı takımyıldızındaki mavi süperdev yıldız. Son derece sıcak ve parlaktır, Güneş'imizden binlerce kat daha fazla ışık saçar.",
 de: "Rigel. Ein blauer Überriese im Orion, extrem heiß und leuchtstark.",
 fr: "Rigel. Une supergéante bleue d'Orion, extrêmement chaude et lumineuse.",
 es: "Rigel. Una supergigante azul en Orión, extremadamente caliente y luminosa.",
 ar: "رجل الجبار. نجم أزرق عملاق في كوكبة الجبار، يتميز بحرارته الشديدة وضياءه الفائق.",
 it: "Rigel. Una supergigante blu in Orione, estremamente calda e luminosa.",
 pt: "Rigel. Uma estrela supergigante azul em Orion, extremamente quente e luminosa."
 },
 betelgeuse: {
 en: "A massive red supergiant star in Orion. It is nearing the end of its stellar life cycle and will eventually go supernova.",
 tr: "Avcı takımyıldızındaki devasa kırmızı süperdev yıldız. Yıldız ömrünün son aşamasındadır ve gelecekte süpernova olarak patlayacaktır.",
 de: "Beteigeuze. Ein massiver roter Überriese im Orion, der sich dem Ende seines Lebenszyklus nehert.",
 fr: "Bételgeuse. Une supergéante rouge massive dans Orion, proche de la fin de sa vie et destinée à exploser en supernova.",
 es: "Betelgeuse. Una supergigante roja masiva en Orión, que se acerca al final de su vida estelar.",
 ar: "إبط الجبار. نجم أحمر عملاق في كوكبة الجبار، يقترب من نهاية دورة حياته وسينفجر في النهاية كسوبرنوفا.",
 it: "Betelgeuse. Una massiccia supergigante rossa in Orione, vicina alla fine del suo ciclo vitale.",
 pt: "Betelgeuse. Uma estrela supergigante vermelha massiva em Orion, aproximando-se do fim de seu ciclo de vida."
 },
 aldebaran: {
 en: "The red eye of the Bull (Taurus). A giant orange star that is cooler than the Sun but over 40 times larger in diameter.",
 tr: "Boğa takımyıldızının parlayan kırmızı gözü. Güneş'ten daha soğuk ancak çap olarak 40 kat daha büyük bir turuncu dev yıldızdır.",
 de: "Aldebaran. Das rote Auge des Stiers, ein orangefarbener Riesenstern.",
 fr: "Aldébaran. L'œil rouge du Taureau, une étoile géante orange 40 fois plus grande que le Soleil.",
 es: "Aldebarán. El ojo rojo del Toro (Tauro), una estrella gigante naranja.",
 ar: "الدبران. العين الحمراء لكوكبة الثور، وهو نجم برتقالي عملاق أبرد من الشمس ولكن قطره أكبر بـ 40 مرة.",
 it: "Aldebaran. L'occhio rosso del Toro, una stella gigante arancione.",
 pt: "Aldebaran. O olho vermelho do Touro (Taurus), uma estrela gigante laranja."
 },
 antares: {
 en: "A massive red supergiant at the heart of Scorpio. Its reddish hue often causes it to be mistaken for the planet Mars.",
 tr: "Akrep takımyıldızının kalbinde yer alan kırmızı süperdev. Kırmızı rengi nedeniyle gökyüzünde sıklıkla Mars gezegeniyle karıştırılır.",
 de: "Antares. Ein roter Überriese im Herzen des Skorpions, oft mit dem Mars verwechselt.",
 fr: "Antarès. Une supergéante rouge au cœur du Scorpion, souvent confondue avec Mars en raison de sa couleur.",
 es: "Antares. Una supergigante roja en el corazón de Escorpio, a menudo confundida con Marte.",
 ar: "قلب العقرب. نجم أحمر عملاق في قلب كوكبة العقرب، غالباً ما يلتبس لونه الأحمر مع كوكب المريخ.",
 it: "Antares. Una massiccia supergigante rossa nel cuore dello Scorpione, spesso confusa con Marte.",
 pt: "Antares. Una supergigante vermelha massiva no coração de Escorpião, frequentemente confundida com Marte."
 },
 Sun: {
 en: "The star at the center of our Solar System. A nearly perfect sphere of hot plasma, sustaining all life on Earth.",
 tr: "Güneş Sistemimizin merkezindeki yıldız. Sıcak plazmadan oluşan neredeyse kusursuz bir küredir ve dünyadaki hayatı destekler.",
 de: "Die Sonne. Der Stern im Zentrum unseres Sonnensystems, eine Kugel aus heißem Plasma.",
 fr: "Le Soleil. L'étoile au centre de notre système solaire, essentielle à la vie sur Terre.",
 es: "El Sol. La estrella en el centro de nuestro sistema solar, sustentadora de la vida en la Tierra.",
 ar: "الشمس. النجم في مركز مجموعتنا الشمسية، وهي كرة شبه مثالية من البلازما الساخنة.",
 it: "Il Sole. La stella al centro del nostro sistema solare, che sostiene la vita sulla Terra.",
 pt: "O Sol. A estrela no centro do nosso Sistema Solar, que sustenta toda a vida na Terra."
 },
 Moon: {
 en: "Earth's only natural satellite. It influences ocean tides, stabilizes Earth's wobble, and goes through beautiful monthly phases.",
 tr: "Dünyamızın tek doğal uydusu. Okyanus gelgitlerini etkiler, Dünya eksenini dengede tutar ve aylık evreler halinde görünür.",
 de: "Der Mond. Der einzige natürliche Satellit der Erde, beeinflusst Gezeiten und stabilisiert die Erdachse.",
 fr: "La Lune. L'unique satellite naturel de la Terre, influençant les marées et stabilisant son axe.",
 es: "La Luna. El único satélite natural de la Tierra, influye en las mareas y estabiliza su eje.",
 ar: "القمر. التابع الطبيعي الوحيد للأرض، يؤثر على حركة المد والجزر ويخضع لأطوار شهرية جميلة.",
 it: "La Luna. L'unico satellite naturale della Terra, influenza le maree e stabilizza l'asse terrestre.",
 pt: "A Lua. O único satélite natural da Terra. Ela influencia as marés oceânicas e estabiliza o eixo terrestre."
 },
 Mercury: {
 en: "The smallest and closest planet to the Sun. It experiences extreme temperature swings from blistering heat to freezing cold.",
 tr: "Güneş'e en yakın ve en küçük gezegen. Gündüzleri kavurucu sıcaklık, geceleri ise dondurucu soğukluk arasında uç sıcaklıklar yaşar.",
 de: "Merkur. Der kleinste und sonnennächste Planet mit extremen Temperaturschwankungen.",
 fr: "Mercure. La planète la plus petite et la plus proche du Soleil, subissant des températures extrêmes.",
 es: "Mercurio. El planeta más pequeño y cercano al Sol, con cambios extremos de temperatura.",
 ar: "عطارد. أصغر كواكب المجموعة الشمسية وأقربها إلى الشمس، يعاني من تقلبات حرارية شديدة.",
 it: "Mercurio. Il pianeta più piccolo e più vicino al Sole, con escursioni termiche estreme.",
 pt: "Mercúrio. O menor planeta e o mais próximo do Sol. Apresenta variações extremas de temperatura."
 },
 Venus: {
 en: "The hottest planet in our solar system, covered in thick clouds of greenhouse gases that trap extreme atmospheric heat.",
 tr: "Güneş sistemimizin en sıcak gezegeni. Yoğun karbondioksit bulutları nedeniyle aşırı bir sera etkisi yaşar ve adeta bir fırın gibidir.",
 de: "Venus. Der heißeste Planet, eingehüllt in dicke Treibhausgaswolken.",
 fr: "Vénus. La planète la plus chaude, couverte d'épais nuages de gaz à effet de serre.",
 es: "Venus. El planeta más caliente, cubierto por densas nubes de gases de efecto invernadero.",
 ar: "الزهرة. أشد كواكب مجموعتنا الشمسية حرارة، مغطى بسحب كثيفة من الغازات الدفيئة.",
 it: "Venere. Il pianeta più caldo, avvolto da dense nubi di gas serra.",
 pt: "Vênus. O planeta mais quente do nosso sistema solar, coberto por densas nuvens de gases estufa."
 },
 Mars: {
 en: "The Red Planet. Iron oxide on its surface gives it a rusty color. It features Olympus Mons, the largest volcano in our solar system.",
 tr: "Kızıl Gezegen. Yüzeyindeki demir oksit (pas) ona kızıl rengini verir. Güneş sisteminin en yüksek volkanı olan Olympus Mons buradadır.",
 de: "Mars. Der Rote Planet, Heimat des Olympus Mons, des größten Vulkans im Sonnensystem.",
 fr: "Mars. La planète rouge, abritant Olympus Mons, le plus grand volcan du système solaire.",
 es: "Marte. El planeta rojo, hogar de Olympus Mons, el volcán más grande del sistema solar.",
 ar: "المريخ. الكوكب الأحمر. يمنحه أكسيد الحديد على سطحه لوناً صدئاً، ويضم بركان أوليمبوس الأكبر في النظام الشمسي.",
 it: "Marte. Il pianeta rosso, che ospita l'Olympus Mons, il vulcano più grande del sistema solare.",
 pt: "Marte. O Planeta Vermelho. O óxido de ferro em sua superfície dá-lhe uma cor de ferrugem."
 },
 Jupiter: {
 en: "The largest planet in our solar system. A gas giant famous for its horizontal cloud belts and the massive Great Red Spot storm.",
 tr: "Güneş sistemimizin en büyük gezegeni. Gaz devidir ve yüzeyindeki enine bulut çizgileri ile devasa \"Büyük Kırmızı Leke\" fırtınasıyla bilinir.",
 de: "Jupiter. Der größte Planet, ein Gasriese, bekannt für seine Wolkenbänder und den Großen Roten Fleck.",
 fr: "Jupiter. La plus grande planète, une géante gazeuse célèbre pour ses bandes nuageuses et sa Grande Tache Rouge.",
 es: "Júpiter. El planeta más grande, un gigante gaseoso famoso por sus bandas de nubes y la Gran Mancha Roja.",
 ar: "المشتري. أكبر كواكب مجموعتنا الشمسية، عملاق غازي يشتهر بأحزمة السحب الأفقية والعاصفة الضخمة للبقعة الحمراء الكبرى.",
 it: "Giove. Il pianeta più grande, un gigante gassoso noto per le bande nuvolose e la Grande Macchia Rossa.",
 pt: "Júpiter. O maior planeta do nosso sistema solar. Um gigante gasoso famoso por suas faixas de nuvens e pela Grande Mancha Vermelha."
 },
 Saturn: {
 en: "The spectacular ringed giant. A gas giant with thousands of thin icy rings and dozens of moons, including the organic-rich Titan.",
 tr: "Halkalı gaz devi. Etrafındaki binlerce buzlu halkası ve organik bileşiklerle dolu Titan uydusu dahil onlarca uydusuyla ünlüdür.",
 de: "Saturn. Der spektakuläre Ringplanet, ein Gasriese mit Tausenden von eisigen Ringen.",
 fr: "Saturne. La spectaculaire géante annelée, dotée de milliers de minces anneaux de glace.",
 es: "Saturno. El espectacular gigante anillado, con miles de delgados anillos de hielo.",
 ar: "زحل. العملاق ذو الحلقات المذهلة، وهو عملاق غازي يضم آلاف الحلقات الجليدية الرقيقة وعشرات الأقمار.",
 it: "Saturno. Lo spettacolare gigante inanellato, con migliaia di sottili anelli di ghiaccio.",
 pt: "Saturno. O espetacular gigante anelado. Um gigante gasoso com milhares de anéis finos de gelo."
 },
 Uranus: {
 en: "An ice giant with a unique pale blue-green color due to methane gas. It orbits tilted almost entirely on its side.",
 tr: "Metan gazı nedeniyle soluk mavi-yeşil renge sahip olan buz devi. Yörüngesinde neredeyse tamamen yan yatmış bir varil gibi döner.",
 de: "Uranus. Ein Eisriese mit einer blassgrünen Farbe, dessen Rotationsachse fast flach auf der Bahnebene liegt.",
 fr: "Uranus. Une géante de glace bleu-vert pâle, orbitant inclinée presque entièrement sur le côté.",
 es: "Urano. Un gigante de hielo de color azul verdoso pálido, inclinado casi por completo sobre su costado.",
 ar: "أورانوس. عملاق جليدي ذو لون أزرق-أخضر باهت فريد بسبب غاز الميثان، ويدور منحنياً على جانبه بالكامل تقريباً.",
 it: "Urano. Un gigante di ghiaccio verde-azzurro, con un asse di rotazione inclinato quasi del tutto sul lato.",
 pt: "Urano. Um gigante de gelo com uma cor azul-esverdeada pálida única. Ele orbita inclinado quase inteiramente de lado."
 },
 Neptune: {
 en: "A deep blue ice giant, home to supersonic winds up to 2,100 km/h. The most distant planet from the Sun in our solar system.",
 tr: "Koyu mavi renkli buz devi. Saatte 2.100 km'ye ulaşan güneş sisteminin en hızlı rüzgarlarına ev sahipliği yapar ve Güneş'e en uzak gezegendir.",
 de: "Neptun. Ein tiefblauer Eisriese mit Überschallwinden und der sonnenfernste Planet.",
 fr: "Neptune. Une géante de glace bleu profond, balayée par des vents supersoniques.",
 es: "Neptuno. Un gigante de hielo azul profundo, con los vientos más rápidos del sistema solar.",
 ar: "نبتون. عملاق جليدي أزرق داكن، موطن لرياح تفوق سرعتها سرعة الصوت وهو الكوكب الأكثر بعداً عن الشمس.",
 it: "Nettuno. Un gigante di ghiaccio blu profondo, spazzato da venti supersonici.",
 pt: "Netuno. Um gigante de gelo azul profundo, lar de ventos supersônicos de até 2.100 km/h."
 }
};

export const planetNames: Record<string, Record<string, string>> = {
 Sun: { en: 'Sun', tr: 'Güneş', de: 'Sonne', fr: 'Soleil', es: 'Sol', ar: 'الشمس', it: 'Sole', pt: 'Sol' },
 Moon: { en: 'Moon', tr: 'Ay', de: 'Mond', fr: 'Lune', es: 'Luna', ar: 'القمر', it: 'Luna', pt: 'Lua' },
 Mercury: { en: 'Mercury', tr: 'Merkür', de: 'Merkur', fr: 'Mercure', es: 'Mercurio', ar: 'عطارد', it: 'Mercurio', pt: 'Mercúrio' },
 Venus: { en: 'Venus', tr: 'Venüs', de: 'Venus', fr: 'Vénus', es: 'Venus', ar: 'الزهرة', it: 'Venere', pt: 'Vênus' },
 Mars: { en: 'Mars', tr: 'Mars', de: 'Mars', fr: 'Mars', es: 'Marte', ar: 'المريخ', it: 'Marte', pt: 'Marte' },
 Jupiter: { en: 'Jupiter', tr: 'Jüpiter', de: 'Jupiter', fr: 'Jupiter', es: 'Júpiter', ar: 'المشتري', it: 'Giove', pt: 'Júpiter' },
 Saturn: { en: 'Saturn', tr: 'Satürn', de: 'Saturn', fr: 'Saturne', es: 'Saturno', ar: 'زحل', it: 'Saturno', pt: 'Saturno' },
 Uranus: { en: 'Uranus', tr: 'Uranüs', de: 'Uranus', fr: 'Uranus', es: 'Urano', ar: 'أورانوس', it: 'Urano', pt: 'Urano' },
 Neptune: { en: 'Neptune', tr: 'Neptün', de: 'Neptun', fr: 'Neptune', es: 'Neptuno', ar: 'نبتون', it: 'Nettuno', pt: 'Netuno' }
};

export const getLocalizedDescription = (id: string, lang: LangCode): string => {
 const desc = celestialDescriptions[id];
 if (!desc) return '';
 return desc[lang] || desc.en || '';
};

export const arInlineTranslations: Partial<Record<string, Record<LangCode, string>>> = {
 startSensor: {
 en: 'Start Sensor', tr: 'Sensörü Başlat', de: 'Sensor starten', fr: 'Démarrer le capteur', es: 'Iniciar sensor', ar: 'بدء المستشعر', it: 'Avvia sensore', pt: 'Iniciar sensor'
 },
 timeTravelPastLabel: {
 en: '-5 Days', tr: '-5 Gün', de: '-5 Tage', fr: '-5 jours', es: '-5 días', ar: '-5 أيام', it: '-5 giorni', pt: '-5 dias'
 },
 timeTravelFutureLabel: {
 en: '+5 Days', tr: '+5 Gün', de: '+5 Tage', fr: '+5 jours', es: '+5 días', ar: '+5 أيام', it: '+5 giorni', pt: '+5 dias'
 },
 timeTravelLiveLabel: {
 en: 'Live', tr: 'Canlı', de: 'Live', fr: 'En direct', es: 'En vivo', ar: 'مباشر', it: 'Dal vivo', pt: 'Ao vivo'
 },
 calibrateCompass: {
 en: 'Calibrate Compass', tr: 'Pusulayı Kalibre Et', de: 'Kompass kalibrieren', fr: 'Calibrer la boussole', es: 'Calibrar brújula', ar: 'معايرة البوصلة', it: 'Calibra bussola', pt: 'Calibrar bússola'
 },
 figure8: {
 en: 'Move your device in a figure 8 pattern to calibrate the sensors for accurate sky tracking.', tr: 'Hassas gökyüzü takibi için cihazınızı 8 çizecek şekilde hareket ettirerek sensörleri kalibre edin.', de: 'Bewegen Sie Ihr Gerät in einer 8er-Form, um die Sensoren zu kalibrieren.', fr: 'Déplacez votre appareil en forme de 8 pour calibrer les capteurs.', es: 'Mueva su dispositivo en forma de 8 para calibrar los sensores.', ar: 'حرك جهازك في شكل 8 لمعايرة المستشعرات.', it: 'Muovi il tuo dispositivo a forma di 8 per calibrare i sensori.', pt: 'Mova seu dispositivo em forma de 8 para calibrar os sensores.'
 },
 calibSuccess: {
 en: 'Calibration Complete!', tr: 'Kalibrasyon Tamamlandı!', de: 'Kalibrierung abgeschlossen!', fr: 'Étalonnage terminé!', es: '¡Calibración completada!', ar: 'تمت المعايرة بنجاح!', it: 'Calibrazione completata!', pt: 'Calibração Concluída!'
 },
 skipCalib: {
 en: 'Skip', tr: 'Geç', de: 'Überspringen', fr: 'Passer', es: 'Omitir', ar: 'تخطي', it: 'Salta', pt: 'Pular'
 },
  favoriteTarget: {
  en: 'Favorite target', tr: 'Favori hedef', de: 'Ziel favorisieren', fr: 'Cible favorite', es: 'Objetivo favorito', ar: 'هدف مفضل', it: 'Bersaglio preferito', pt: 'Alvo favorito'
  },
  removeFavoriteTarget: {
  en: 'Remove favorite', tr: 'Favoriden çıkar', de: 'Favorit entfernen', fr: 'Retirer des favoris', es: 'Quitar de favoritos', ar: 'إزالة من المفضلة', it: 'Rimuovi dai preferiti', pt: 'Remover dos favoritos'
  },
  captureView: {
  en: 'Save AR view', tr: 'AR görüntüsünü kaydet', de: 'AR-Ansicht speichern', fr: 'Enregistrer la vue AR', es: 'Guardar vista AR', ar: 'حفظ عرض الواقع المعزز', it: 'Salva vista AR', pt: 'Salvar visualização AR'
  },
  captureReady: {
  en: 'AR image is ready', tr: 'AR görüntüsü hazır', de: 'AR-Bild ist bereit', fr: 'Image AR prête', es: 'Imagen AR lista', ar: 'صورة الواقع المعزز جاهزة', it: 'Immagine AR pronta', pt: 'Imagem AR pronta'
  },
  captureFailed: {
  en: 'Could not save AR image', tr: 'AR görüntüsü kaydedilemedi', de: 'AR-Bild konnte nicht gespeichert werden', fr: "Impossible d'enregistrer l'image AR", es: 'No se pudo guardar la imagen AR', ar: 'تعذر حفظ صورة الواقع المعزز', it: "Impossibile salvare l'immagine AR", pt: 'Não foi possível salvar a imagem AR'
  },
  qualityHigh: {
  en: 'High quality', tr: 'Yüksek kalite', de: 'Hohe Qualität', fr: 'Haute qualité', es: 'Alta calidad', ar: 'جودة عالية', it: 'Alta qualità', pt: 'Alta qualidade'
  },
  qualityBalanced: {
  en: 'Balanced', tr: 'Dengeli', de: 'Ausgewogen', fr: 'Équilibré', es: 'Equilibrado', ar: 'متوازن', it: 'Bilanciato', pt: 'Equilibrado'
  },
  qualitySaver: {
  en: 'Battery saver', tr: 'Pil tasarrufu', de: 'Energiesparmodus', fr: 'Économiseur de batterie', es: 'Ahorro de batería', ar: 'توفير البطارية', it: 'Risparmio batteria', pt: 'Economia de bateria'
  },
  recentSessions: {
  en: 'Saved AR sessions', tr: 'Kayıtlı AR oturumları', de: 'Gespeicherte AR-Sitzungen', fr: 'Sessions AR enregistrées', es: 'Sesiones AR guardadas', ar: 'جلسات الواقع المعزز المحفوظة', it: 'Sessioni AR salvate', pt: 'Sessões AR salvas'
  },
  continue: {
 en: 'Continue', tr: 'Devam Et', de: 'Weiter', fr: 'Continuer', es: 'Continuar', ar: 'متابعة', it: 'Continua', pt: 'Continuar'
 }
};
