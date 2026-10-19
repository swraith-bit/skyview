import { LangCode } from '../i18n';
import { makeInstantForTimeZone } from './dateTime';

export const getShowerName = (name: string, lang: LangCode): string => {
  const mapping: Record<string, Record<LangCode, string>> = {
    'Quadrantids': {
      en: 'Quadrantids', tr: 'Kuadrantid', de: 'Quadrantiden',
      fr: 'Quadrantides', es: 'Cuadrántidas', ar: 'الكوادانتيدات',
      it: 'Quadrantidi', pt: 'Quadrantídeas'
    },
    'Lyrids': {
      en: 'Lyrids', tr: 'Lirid', de: 'Lyriden',
      fr: 'Lyrides', es: 'Líridas', ar: 'الليريات',
      it: 'Liridi', pt: 'Líridas'
    },
    'Eta Aquariids': {
      en: 'Eta Aquariids', tr: 'Eta Akvaryid', de: 'Eta-Aquariiden',
      fr: 'Êta aquarides', es: 'Eta Acuáridas', ar: 'إيتا الدلويات',
      it: 'Eta Aquaridi', pt: 'Eta Aquáridas'
    },
    'Delta Aquariids': {
      en: 'Delta Aquariids', tr: 'Delta Akvaryid', de: 'Delta-Aquariiden',
      fr: 'Delta aquarides', es: 'Delta Acuáridas', ar: 'دلتا الدلويات',
      it: 'Delta Aquaridi', pt: 'Delta Aquáridas'
    },
    'Perseids': {
      en: 'Perseids', tr: 'Perseid', de: 'Perseiden',
      fr: 'Perséides', es: 'Perseidas', ar: 'البرشاويات',
      it: 'Perseidi', pt: 'Perseidas'
    },
    'Draconids': {
      en: 'Draconids', tr: 'Drakonid', de: 'Drakoniden',
      fr: 'Draconides', es: 'Dracónidas', ar: 'التنينيات',
      it: 'Draconidi', pt: 'Draconídeas'
    },
    'Orionids': {
      en: 'Orionids', tr: 'Orionid', de: 'Orioniden',
      fr: 'Orionides', es: 'Oriónidas', ar: 'الجباريات',
      it: 'Orionidi', pt: 'Orionídeas'
    },
    'Leonids': {
      en: 'Leonids', tr: 'Leonid', de: 'Leoniden',
      fr: 'Léonides', es: 'Leónidas', ar: 'الأسديات',
      it: 'Leonidi', pt: 'Leónidas'
    },
    'Geminids': {
      en: 'Geminids', tr: 'Geminid', de: 'Geminiden',
      fr: 'Géminides', es: 'Gemínidas', ar: 'التوأميات',
      it: 'Geminidi', pt: 'Geminídeas'
    },
    'Ursids': {
      en: 'Ursids', tr: 'Ursid', de: 'Ursiden',
      fr: 'Ursides', es: 'Úrsidas', ar: 'الدبيات',
      it: 'Ursidi', pt: 'Ursídeas'
    }
  };
  return mapping[name]?.[lang] || mapping[name]?.en || name;
};

export interface Shower {
  name: string;
  parent: string;
  peak: Date;
  zhr: number;
  duration: string;   // e.g. "Jul 17 – Aug 24"
  radiant: string;    // constellation
  speed: number;      // km/s
  bestTime: string;   // e.g. "After midnight"
  description: Partial<Record<LangCode, string>> & {en: string};
  viewingTip:  Partial<Record<LangCode, string>> & {en: string};
}

export function buildShowers(year: number, timeZone?: string): Shower[] {
  return [
    {
      name: 'Quadrantids',
      parent: 'Asteroid 2003 EH1',
      peak: makeInstantForTimeZone(year, 0, 3, 12, timeZone),
      zhr: 120,
      duration: 'Jan 1–5',
      radiant: 'Boötes',
      speed: 41,
      bestTime: 'Before dawn',
      description: {
        en: 'One of the strongest annual showers, with a very narrow peak of just 6–12 hours. Best seen from the Northern Hemisphere in early January.',
        tr: 'Yılın en güçlü meteor yağmurlarından biri. Zirve süresi sadece 6–12 saattir. Ocak başında Kuzey Yarıküresi\'nden en iyi gözlemlenir.',
        de: 'Einer der stärksten jährlichen Schauer mit einem sehr engen Höhepunkt von nur 6–12 Stunden. Am besten von der Nordhalbkugel im frühen Januar zu sehen.',
        fr: 'L\'une des pluies annuelles les plus fortes, avec un pic étroit de 6 à 12 heures. Mieux visible depuis l\'hémisphère nord début janvier.',
        es: 'Una de las lluvias anuales más fuertes, con un pico estrecho de 6 a 12 horas. Mejor visible desde el hemisferio norte a principios de enero.',
        ar: 'واحدة من أقوى الزخات السنوية، مع ذروة ضيقة للغاية تستمر من 6 إلى 12 ساعة. تُرى بشكل أفضل من نصف الكرة الشمالي في أوائل يناير.',
        it: 'Una delle piogge annuali più forti, con un picco stretto di sole 6-12 ore. Visibile al meglio dall\'emisfero settentrionale all\'inizio di gennaio.',
        pt: 'Uma das chuvas anuais mais fortes, com um pico estreito de apenas 6 a 12 horas. Melhor visualizada no Hemisfério Norte no início de janeiro.'
      },
      viewingTip: {
        en: 'Find a dark spot away from city lights. Look toward the northeast after midnight.',
        tr: 'Şehir ışıklarından uzak karanlık bir yer bulun. Gece yarısından sonra kuzeydoğuya bakın.',
        de: 'Einen dunklen Ort weit weg von Stadtlichtern suchen. Nach Mitternacht in Richtung Nordosten schauen.',
        fr: 'Trouvez un endroit sombre loin des lumières de la ville. Regardez vers le nord-est après minuit.',
        es: 'Busca un lugar oscuro lejos de las luces de la ciudad. Mira hacia el noreste después de medianoche.',
        ar: 'ابحث عن مكان مظلم بعيدًا عن أضواء المدينة. انظر نحو الشمال الشرقي بعد منتصف الليل.',
        it: 'Trova un punto buio lontano dalle luci della città. Guarda verso nord-est dopo mezzanotte.',
        pt: 'Encontre um local escuro longe das luzes da cidade. Olhe para o nordeste após a meia-noite.'
      },
    },
    {
      name: 'Lyrids',
      parent: 'Comet Thatcher',
      peak: makeInstantForTimeZone(year, 3, 22, 12, timeZone),
      zhr: 18,
      duration: 'Apr 14–30',
      radiant: 'Lyra',
      speed: 49,
      bestTime: 'After midnight',
      description: {
        en: 'One of the oldest known meteor showers, with records dating back 2,700 years. Produces bright meteors, occasionally with persistent trains.',
        tr: '2.700 yıllık kayıtlarıyla en eski bilinen meteor yağmurlarından biri. Zaman zaman parlak ve kalıcı izler bırakan meteorlar üretir.',
        de: 'Einer der ältesten bekannten Meteorschauer mit Aufzeichnungen von vor 2.700 Jahren. Erzeugt helle Meteore, gelegentlich mit anhaltenden Spuren.',
        fr: 'L\'une des plus anciennes pluies de météores connues (2700 ans d\'histoire). Produit des météores brillants avec parfois des traînées persistantes.',
        es: 'Una de las lluvias de meteoros más antiguas conocidas (2700 años de historia). Produce meteoros brillantes, a veces con estelas persistentes.',
        ar: 'واحدة من أقدم زخات الشهب المعروفة، ولها سجلات تعود إلى 2700 عام. تنتج شهباً لامعة، وتترك أحياناً مسارات مستمرة.',
        it: 'Una delle piogge meteoriche più antiche conosciute (2700 anni di storia). Produce meteore brillante, talvolta con scie persistenti.',
        pt: 'Uma das chuvas de meteoros mais antigas conhecidas (2700 anos de história). Produz meteoros brilhantes, às vezes com caudas persistentes.'
      },
      viewingTip: {
        en: 'Lyra constellation rises in the northeast. Lie flat on your back and look straight up.',
        tr: 'Lyra takımyıldızı kuzeydoğudan yükselir. Sırt üstü uzanın ve direkt yukarı bakın.',
        de: 'Das Sternbild Leier steigt im Nordosten auf. Flach auf den Rücken legen und direkt nach oben schauen.',
        fr: 'La constellation de la Lyre se lève au nord-est. Allongez-vous sur le dos et regardez vers le ciel.',
        es: 'La constelación de Lyra se eleva por el noreste. Acuéstate boca arriba y mira hacia arriba.',
        ar: 'تشرق كوكبة القيثارة في الشمال الشرقي. استلق على ظهرك وانظر مباشرة إلى الأعلى.',
        it: 'La costellazione della Lira sorge a nord-est. Sdraiati sulla schiena e guarda dritto in alto.',
        pt: 'A constelação de Lyra nasce no nordeste. Deite-se de costas e olhe para cima.'
      },
    },
    {
      name: 'Eta Aquariids',
      parent: "Halley's Comet",
      peak: makeInstantForTimeZone(year, 4, 6, 12, timeZone),
      zhr: 50,
      duration: 'Apr 19 – May 28',
      radiant: 'Aquarius',
      speed: 66,
      bestTime: 'Before dawn',
      description: {
        en: 'Debris from Halley\'s Comet. Known for fast meteors with long glowing trails. Excellent for Southern Hemisphere observers.',
        tr: 'Halley Kuyrukluyu yıldızı kalıntılarından oluşur. Uzun parlayan izlere sahip hızlı meteorlarla tanınır. Güney Yarıküresi gözlemcileri için mükemmeldir.',
        de: 'Trümmer des Halley\'schen Kometen. Bekannt für schnelle Meteore mit langen leuchtenden Spuren. Ausgezeichnet für Beobachter auf der südlichen Hemisphäre.',
        fr: 'Débris de la comète de Halley. Connue pour ses météores rapides avec de longues traînées lumineuses. Excellente pour l\'hémisphère sud.',
        es: 'Residuos del cometa Halley. Conocida por meteoros rápidos con largas estelas brillantes. Excelente para el hemisferio sur.',
        ar: 'حطام من مذنب هالي. تشتهر بشهبها السريعة ذات المسارات الطويلة المضيئة. ممتازة للمراقبين في نصف الكرة الجنوبي.',
        it: 'Detriti della cometa di Halley. Nota per meteore veloci con lunghe scie luminose. Eccellente per l\'esmisfero meridionale.',
        pt: 'Detritos do Cometa Halley. Conhecida por meteoros rápidos com longas caudas brilhantes. Excelente para observadores no Hemisfério Sul.'
      },
      viewingTip: {
        en: 'Best viewed before sunrise. Aquarius rises in the east — no telescope needed.',
        tr: 'Gün doğumundan önce en iyi görüntülenir. Kova takımyıldızı doğudan yükselir. Teleskop gerekmez.',
        de: 'Vor dem Sonnenaufgang am besten zu sehen. Wassermann steigt im Osten auf — kein Teleskop nötig.',
        fr: 'Mieux visible avant le lever du soleil. Le Verseau se lève à l\'est — aucun télescope requis.',
        es: 'Mejor ver antes del amanecer. Acuario se eleva por el este — no se necesita telescopio.',
        ar: 'أفضل وقت للمراقبة هو قبل شروق الشمس. تشرق كوكبة الدلو في الشرق — لا حاجة لتلسكوب.',
        it: 'Visibile al meglio prima dell\'alba. L\'Acquario sorge a est — non è necessario alcun telescopio.',
        pt: 'Melhor visualizada antes do amanhecer. Aquário nasce no leste — não é necessário telescópio.'
      },
    },
    {
      name: 'Delta Aquariids',
      parent: "Comet 96P/Machholz",
      peak: makeInstantForTimeZone(year, 6, 29, 12, timeZone),
      zhr: 25,
      duration: 'Jul 12 – Aug 23',
      radiant: 'Aquarius',
      speed: 41,
      bestTime: 'After midnight',
      description: {
        en: 'Overlaps with the beginning of the Perseid shower. Produces medium-speed meteors with faint persistent trains.',
        tr: 'Perseid yağmurunun başlangıcıyla örtüşür. Soluk kalıcı izlerle orta hızda meteorlar üretir.',
        de: 'Überschneidet sich mit dem Beginn des Perseiden-Schauers. Erzeugt mittelschnelle Meteore mit schwachen anhaltenden Spuren.',
        fr: 'Se superpose au début de la pluie des Perséides. Produit des météores de vitesse moyenne avec de faibles traînées persistantes.',
        es: 'Se superpone con el inicio de las Perseidas. Produce meteoros de velocidad media con estelas tenues y persistentes.',
        ar: 'تتداخل مع بداية زخات البرشاويات. تنتج شهباً متوسطة السرعة مع مسارات خافتة مستمرة.',
        it: 'Si sovrappone all\'inizio delle Perseidi. Produce meteore di media velocità con scie persistenti deboli.',
        pt: 'Sobrepõe-se ao início da chuva das Perseidas. Produz meteoros de velocidade média com caudas fracas e persistentes.'
      },
      viewingTip: {
        en: 'Southern sky offers the best view. Can be combined with early Perseids.',
        tr: 'Güney gökyüzü en iyi görünümü sunar. Erken Perseid\'lerle birleştirilebilir.',
        de: 'Der südliche Himmel bietet die beste Sicht. Kann mit frühen Perseids kombiniert werden.',
        fr: 'Le ciel méridional offre la meilleure vue. Peut être combiné avec les premières Perséides.',
        es: 'El cielo del sur ofrece la mejor vista. Se puede combinar con las primeras Perseidas.',
        ar: 'السماء الجنوبية توفر أفضل رؤية. يمكن دمجها مع شهب البرشاويات المبكرة.',
        it: 'Il cielo meridionale offre la vista migliore. Può essere combinata con le prime Perseidi.',
        pt: 'O céu do sul oferece a melhor visualização. Pode ser combinada com as primeiras Perseidas.'
      },
    },
    {
      name: 'Perseids',
      parent: "Comet Swift-Tuttle",
      peak: makeInstantForTimeZone(year, 7, 12, 12, timeZone),
      zhr: 100,
      duration: 'Jul 17 – Aug 24',
      radiant: 'Perseus',
      speed: 59,
      bestTime: 'After midnight',
      description: {
        en: 'The most popular meteor shower of the year! Warm summer nights, up to 100 meteors per hour at peak. Produces many bright fireballs.',
        tr: 'Yılın en popüler meteor yağmuru! Sıcak yaz geceleri, zirvedeyken saatte 100\'e kadar meteor. Pek çok parlak ateş topu üretir.',
        de: 'Der beliebteste Meteorschauer des Jahres! Warme Sommernächte, bis zu 100 Meteore pro Stunde auf dem Höhepunkt. Erzeugt viele helle Feuerbälle.',
        fr: 'La pluie de météores la plus populaire de l\'année ! Nuits d\'été chaudes, jusqu\'à 100 météores par heure. Produit de nombreuses boules de feu.',
        es: '¡La lluvia de meteoros más popular del año! Noches cálidas de verano, hasta 100 meteoros por hora. Produce muchas bolas de fuego brillantes.',
        ar: 'زخات الشهب الأكثر شعبية في العام! ليالي الصيف الدافئة، تصل إلى 100 شهاب في الساعة. تنتج العديد من الكرات النارية اللامعة.',
        it: 'La pioggia meteorica più famosa dell\'anno! Notti calde d\'estate, fino a 100 meteore all\'ora al picco. Produce molte palle di fuoco luminose.',
        pt: 'A chuva de meteoros mais popular do ano! Noites quentes de verão, com até 100 meteoros por hora no pico. Produz muitas bolas de fogo brilhantes.'
      },
      viewingTip: {
        en: 'No equipment needed. Just find a dark sky, lie back, and enjoy the show. Best after midnight.',
        tr: 'Ekipman gerekmez. Sadece karanlık bir gökyüzü bulun, uzanın ve şovu izleyin. Gece yarısından sonra en iyi.',
        de: 'Keine Ausrüstung nötig. Einfach einen dunklen Himmel finden, hinlegen und die Show genießen. Am besten nach Mitternacht.',
        fr: 'Aucun équipement requis. Trouvez simplement un ciel sombre, allongez-vous et profitez du spectacle.',
        es: 'No se necesita equipo. Solo busca un cielo oscuro, acuéstate y disfruta del espectáculo.',
        ar: 'لا حاجة لمعدات. فقط ابحث عن سماء مظلمة، واستلق، واستمتع بالعرض.',
        it: 'Nessuna attrezzatura necessaria. Trova solo un cielo buio, sdraiati e goditi lo spettacolo.',
        pt: 'Nenhum equipamento necessário. Apenas encontre um céu escuro, deite-se e aproveite o show.'
      },
    },
    {
      name: 'Draconids',
      parent: 'Comet 21P/Giacobini-Zinner',
      peak: makeInstantForTimeZone(year, 9, 8, 12, timeZone),
      zhr: 10,
      duration: 'Oct 6–10',
      radiant: 'Draco',
      speed: 20,
      bestTime: 'Evening (dusk)',
      description: {
        en: 'Unique for being best observed in the evening rather than after midnight. Slow-moving meteors originating from Draco.',
        tr: 'Gece yarısından sonra değil, akşam saatlerinde gözlemlenmesiyle benzersizdir. Draco\'dan kaynaklanan yavaş hareket eden meteorlar.',
        de: 'Einzigartig, da sie abends statt nach Mitternacht am besten zu beobachten sind. Langsam bewegende Meteore aus dem Drachen.',
        fr: 'Unique car elle s\'observe mieux en soirée plutôt qu\'après minuit. Météores lents provenant de la constellation du Dragon.',
        es: 'Única por observarse mejor al atardecer en lugar de después de medianoche. Meteoros lentos originados en Draco.',
        ar: 'فريدة من نوعها حيث يفضل رصدها في المساء بدلاً من بعد منتصف الليل. شهب بطيئة الحركة تنطلق من كوكبة التنين.',
        it: 'Unica per essere osservata al meglio la sera anziché dopo mezzanotte. Meteore lente originarie del Dragone.',
        pt: 'Única por ser melhor observada à noite e não após a meia-noite. Meteoros de movimento lento originários de Draco.'
      },
      viewingTip: {
        en: 'Best observed right after dusk. Draco is in the northern sky — face north.',
        tr: 'Alacakaranlıktan hemen sonra en iyi gözlemlenir. Draco kuzey gökyüzündedir — kuzeye bakın.',
        de: 'Am besten direkt nach der Abenddämmerung beobachten. Draco ist am Nordhimmel — nach Norden schauen.',
        fr: 'Mieux visible juste après le crépuscule. Le Dragon est dans le ciel du nord — regardez vers le nord.',
        es: 'Mejor observar justo después del anochecer. Draco está en el cielo del norte — mira al norte.',
        ar: 'أفضل وقت للرصد هو بعد الغسق مباشرة. كوكبة التنين تقع في السماء الشمالية — توجه نحو الشمال.',
        it: 'Da osservare subito dopo l\'imbrunire. Il Dragone è nel cielo settentrionale — guarda a nord.',
        pt: 'Melhor observada logo após o anoitecer. Draco está no céu do norte — olhe para o norte.'
      },
    },
    {
      name: 'Orionids',
      parent: "Halley's Comet",
      peak: makeInstantForTimeZone(year, 9, 21, 12, timeZone),
      zhr: 20,
      duration: 'Oct 2 – Nov 7',
      radiant: 'Orion',
      speed: 66,
      bestTime: 'After midnight',
      description: {
        en: 'Second meteor shower from Halley\'s Comet! Fast meteors sometimes leave glowing trains for several seconds.',
        tr: 'Halley\'in ikinci meteor yağmuru! Hızlı meteorlar bazen birkaç saniyeliğine parlayan izler bırakır.',
        de: 'Zweiter Meteorschauer von Halley\'s Komet! Schnelle Meteore hinterlassen manchmal für mehrere Sekunden leuchtende Spuren.',
        fr: 'Deuxième pluie de météores issue de la comète de Halley ! Météores rapides laissant parfois des traînées lumineuses persistantes.',
        es: '¡Segunda lluvia de meteoros del cometa Halley! Meteoros rápidos que a veces dejan estelas brillantes durante varios segundos.',
        ar: 'زخات الشهب الثانية الناتجة عن مذنب هالي! شهب سريعة تترك أحياناً مسارات مضيئة لعدة ثوانٍ.',
        it: 'Seconda pioggia meteorica dalla cometa di Halley! Meteore veloci che talvolta lasciano scie luminose per diversi secondi.',
        pt: 'Segunda chuva de meteoros do Cometa Halley! Meteoros rápidos que às vezes deixam caudas brilhantes por vários segundos.'
      },
      viewingTip: {
        en: 'Look for the constellation Orion in the southeast. A great autumn shower.',
        tr: 'Güneydoğuda Orion takımyıldızını arayın. Harika bir sonbahar yağmuru.',
        de: 'Das Sternbild Orion im Südosten suchen. Ein großartiger Herbstschauer.',
        fr: 'Recherchez Orion au sud-est. Une magnifique pluie d\'automne.',
        es: 'Busca la constelación de Orión en el sureste. Una gran lluvia de otoño.',
        ar: 'ابحث عن كوكبة الجبار (Orion) في الجنوب الشرقي. زخة خريفية رائعة.',
        it: 'Cerca la costellazione di Orione a sud-est. Una fantastica pioggia autunnale.',
        pt: 'Procure a constelação de Orion no sudeste. Uma ótima chuva de outono.'
      },
    },
    {
      name: 'Leonids',
      parent: 'Comet Tempel-Tuttle',
      peak: makeInstantForTimeZone(year, 10, 17, 12, timeZone),
      zhr: 15,
      duration: 'Nov 6–30',
      radiant: 'Leo',
      speed: 71,
      bestTime: 'After midnight',
      description: {
        en: 'Known for producing meteor storms every 33 years. Extremely fast meteors. The historic 1833 Leonid storm had an estimated 100,000 meteors per hour!',
        tr: 'Her 33 yılda bir meteor fırtınaları üretmesiyle tanınır. Son derece hızlı meteorlar. 1833\'teki tarihi Leonid fırtınasının saatte 100.000 meteor olduğu tahmin edilmektedir!',
        de: 'Bekannt für die Erzeugung von Meteorstürmen alle 33 Jahre. Extrem schnelle Meteore. Der historische Leoniden-Sturm von 1833 hatte schätzungsweise 100.000 Meteore pro Stunde!',
        fr: 'Connue pour produire des tempêtes de météores tous les 33 ans. Météores extrêmement rapides. La tempête historique de 1833 a produit 100 000 météores par heure !',
        es: 'Conocida por producir tormentas de meteoros cada 33 años. Meteoros extremadamente rápidos. ¡La tormenta histórica de 1833 tuvo unos 100,000 meteoros por hora!',
        ar: 'تشتهر بإنتاج عواصف شهابية كل 33 عاماً. شهب سريعة للغاية. عاصفة الأسديات التاريخية عام 1833 سجلت ما يقدر بـ 100,000 شهاب في الساعة!',
        it: 'Nota per produrre tempeste meteoriche ogni 33 anni. Meteore estremamente veloci. La storica tempesta delle Leonidi del 1833 contò circa 100.000 meteore all\'ora!',
        pt: 'Conhecida por produzir tempestades de meteoros a cada 33 anos. Meteoros extremamente rápidos. A histórica tempestade de Leónidas de 1833 teve cerca de 100.000 meteoros por hora!'
      },
      viewingTip: {
        en: 'Leo rises after midnight. Give your eyes 20 minutes to adapt to the dark.',
        tr: 'Leo gece yarısından sonra yükselir. Gözlerinizin karanlığa alışması için 20 dakika bekleyin.',
        de: 'Leo steigt nach Mitternacht auf. Geben Sie Ihren Augen 20 Minuten, um sich an die Dunkelheit zu gewöhnen.',
        fr: 'Le Lion se lève après minuit. Laissez vos yeux s\'adapter à l\'obscurité pendant 20 minutes.',
        es: 'Leo se eleva después de medianoche. Dale a tus ojo 20 minutos para adaptarse a la oscuridad.',
        ar: 'تشرق كوكبة الأسد بعد منتصف الليل. امنح عينيك 20 دقيقة للتكيف مع الظلام.',
        it: 'Il Leone sorge dopo mezzanotte. Dai ai tuoi occhi 20 minuti per abituarsi al buio.',
        pt: 'Leão nasce após a meia-noite. Dê aos seus olhos 20 minutos para se adaptarem ao escuro.'
      },
    },
    {
      name: 'Geminids',
      parent: 'Asteroid 3200 Phaethon',
      peak: makeInstantForTimeZone(year, 11, 14, 12, timeZone),
      zhr: 150,
      duration: 'Dec 4–20',
      radiant: 'Gemini',
      speed: 35,
      bestTime: 'All night',
      description: {
        en: 'The best and most reliable meteor shower! Unusually, it originates from an asteroid, not a comet. Colorful, slow meteors. Up to 150 per hour at peak.',
        tr: 'En iyi ve en güvenilir meteor yağmuru! Alışılmadık şekilde bir kuyruklu yıldızdan değil asteroidten kaynaklanır. Renkli, yavaş meteorlar. Zirvedeyken saatte 150\'ye kadar.',
        de: 'Der beste und zuverlässigste Meteorschauer! Ungewöhnlicherweise kommt er von einem Asteroiden, nicht von einem Kometen. Bunte, langsame Meteore. Bis zu 150 pro Stunde auf dem Höhepunkt.',
        fr: 'La meilleure et la plus fiable des pluies de météores ! Provient d\'un astéroïde et non d\'une comète. Météores colorés et lents, jusqu\'à 150 par heure.',
        es: '¡La mejor y más confiable lluvia de meteoros! Curiosamente, proviene de un asteroide, no de un cometa. Meteoros coloridos y lentos, hasta 150 por hora.',
        ar: 'الزخة الأفضل والأكثر موثوقية! على غير العادة، مصدرها كويكب وليس مذنباً. شهب ملونة وبطيئة، تصل إلى 150 شهاباً في الساعة.',
        it: 'La pioggia meteorica migliore e più affidabile! Insolitamente proviene da un asteroide, non da una cometa. Meteore colorate e lente, fino a 150 all\'ora al picco.',
        pt: 'A melhor e mais confiável chuva de meteoros! De forma incomum, ela se origina de um asteroide, não de um cometa. Meteoros coloridos e lentos, até 150 por hora no pico.'
      },
      viewingTip: {
        en: 'Best annual show! Gemini rises early evening — you can start watching at 9pm. Bundle up warm.',
        tr: 'Yılın en iyi gösterisi! İkizler akşam erken yükselir — saat 21:00\'dan itibaren izleyebilirsiniz. Sıcak giyin.',
        de: 'Beste jährliche Show! Gemini steigt früh am Abend auf — Sie können ab 21:00 Uhr zuschauen. Warm einpacken.',
        fr: 'Le meilleur spectacle annuel ! Les Gémeaux se lèvent tôt, vous pouvez observer dès 21h. Habillez-vous chaudement.',
        es: '¡El mejor espectáculo anual! Géminis se eleva temprano — puedes empezar a mirar a las 9 pm. Abrígate bien.',
        ar: 'أفضل عرض سنوي! تشرق كوكبة التوأمين في أول المساء — يمكنك البدء بالمراقبة من الساعة 9 مساءً. ارتدِ ملابس دافئة.',
        it: 'Il miglior spettacolo dell\'anno! I Gemelli sorgono presto — puoi iniziare a guardare dalle 21:00. Vestiti caldo.',
        pt: 'Melhor show anual! Gêmeos nasce no início da noite — você pode começar a assistir às 21h. Vista-se bem.'
      },
    },
    {
      name: 'Ursids',
      parent: 'Comet 8P/Tuttle',
      peak: makeInstantForTimeZone(year, 11, 22, 12, timeZone),
      zhr: 10,
      duration: 'Dec 17–25',
      radiant: 'Ursa Minor',
      speed: 33,
      bestTime: 'After midnight',
      description: {
        en: 'A modest shower that peaks around the winter solstice. Circumpolar from Northern Hemisphere latitudes — visible all night long.',
        tr: 'Kış gündönümü civarında zirveye ulaşan mütevazı bir yağmur. Kuzey Yarıküresi enlemlerinden kutup çevresi — tüm gece boyunca görünür.',
        de: 'Ein bescheidener Schauer, der um die Wintersonnenwende seinen Höhepunkt erreicht. Von nördlichen Breiten zirkumpolar — die ganze Nacht sichtbar.',
        fr: 'Une pluie modeste qui culmine autour du solstice d\'hiver. Circumpolaire dans l\'hémisphère nord, visible toute la nuit.',
        es: 'Una lluvia modesta que alcanza su pico alrededor del solsticio de invierno. Circumpolar desde el hemisferio norte, visible toda la noche.',
        ar: 'زخة متواضعة تصل ذروتها حول الانقلاب الشتوي. تدور حول القطب من خطوط العرض الشمالية — مرئية طوال الليل.',
        it: 'Una pioggia modesta che tocca il picco intorno al solstizio d\'inverno. Circumpolare dall\'esmisfero settentrionale, visibile tutta la notte.',
        pt: 'Uma chuva modesta que atinge o pico em torno do solstício de inverno. Circumpolar no Hemisfério Norte, visível a noite toda.'
      },
      viewingTip: {
        en: 'Look toward Polaris (the North Star). A quiet shower for dedicated observers.',
        tr: 'Polaris\'e (Kuzey Yıldızı) doğru bakın. Kararlı gözlemciler için sessiz bir yağmur.',
        de: 'In Richtung Polaris (Nordstern) schauen. Ein ruhiger Schauer für engagierte Beobachter.',
        fr: 'Regardez vers l\'étoile polaire (Polaris). Une pluie tranquille pour les observateurs dévoués.',
        es: 'Mira hacia Polaris (la Estrella del Norte). Una lluvia tranquila para observadores dedicados.',
        ar: 'انظر باتجاه نجم الشمال (Polaris). زخة هادئة للمراقبين المتفانين.',
        it: 'Guarda verso la Stella Polare (Polaris). Una pioggia tranquilla per osservatori dedicati.',
        pt: 'Olhe em direção a Polaris (a Estrela do Norte). Uma chuva calma para observadores dedicados.'
      },
    },
  ];
}
