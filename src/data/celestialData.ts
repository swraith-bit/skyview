export interface Star {
  id: string;
  ra: number;  // Right Ascension in hours (0 to 24)
  dec: number; // Declination in degrees (-90 to 90)
  mag: number; // Apparent magnitude (lower is brighter)
  names: Record<string, string>;
}

export interface Constellation {
  id: string;
  names: Record<string, string>;
  connections: [string, string][]; // pairs of Star IDs
}

// 60+ Brightest and recognizable stars in both hemispheres
export const stars: Star[] = [
  {
    id: 'polaris',
    ra: 2.53,
    dec: 89.26,
    mag: 1.97,
    names: {
      en: 'Polaris (North Star)',
      tr: 'Demirkazık (Kutup Yıldızı)',
      de: 'Polaris (Nordstern)',
      fr: 'Polaris (Étoile du Nord)',
      es: 'Polaris (Estrella Polar)',
      ar: 'النجم القطبي (الجدى)',
      it: 'Polaris (Stella Polare)',
      pt: 'Polaris (Estrela Polar)'
    }
  },
  {
    id: 'sirius',
    ra: 6.75,
    dec: -16.72,
    mag: -1.46,
    names: {
      en: 'Sirius',
      tr: 'Akyıldız (Sirius)',
      de: 'Sirius',
      fr: 'Sirius',
      es: 'Sirio',
      ar: 'الشعرى اليمانية',
      it: 'Sirio',
      pt: 'Sírius'
    }
  },
  {
    id: 'canopus',
    ra: 6.4,
    dec: -52.7,
    mag: -0.74,
    names: {
      en: 'Canopus',
      tr: 'Kanopus',
      de: 'Kanopus',
      fr: 'Canope',
      es: 'Canopo',
      ar: 'سهيل',
      it: 'Canopo',
      pt: 'Canopus'
    }
  },
  {
    id: 'rigil_kent',
    ra: 14.66,
    dec: -60.83,
    mag: -0.27,
    names: {
      en: 'Rigil Kentaurus',
      tr: 'Alfa Centauri A',
      de: 'Rigil Kentaurus',
      fr: 'Rigil Kentaurus',
      es: 'Rigil Kentaurus',
      ar: 'رجل القنطور',
      it: 'Rigil Kentaurus',
      pt: 'Rigil Kentaurus'
    }
  },
  {
    id: 'arcturus',
    ra: 14.26,
    dec: 19.18,
    mag: -0.05,
    names: {
      en: 'Arcturus',
      tr: 'Çoban Yıldızı (Arkturus)',
      de: 'Arktur',
      fr: 'Arcturus',
      es: 'Arcturo',
      ar: 'السماك الرامح',
      it: 'Arturo',
      pt: 'Arcturus'
    }
  },
  {
    id: 'vega',
    ra: 18.62,
    dec: 38.78,
    mag: 0.03,
    names: {
      en: 'Vega',
      tr: 'Vega',
      de: 'Vega',
      fr: 'Véga',
      es: 'Vega',
      ar: 'النسر الواقع',
      it: 'Vega',
      pt: 'Vega'
    }
  },
  {
    id: 'capella',
    ra: 5.28,
    dec: 46.0,
    mag: 0.08,
    names: {
      en: 'Capella',
      tr: 'Kapella',
      de: 'Kapella',
      fr: 'Capella',
      es: 'Capella',
      ar: 'العيوق',
      it: 'Capella',
      pt: 'Capella'
    }
  },
  {
    id: 'rigel',
    ra: 5.25,
    dec: -8.2,
    mag: 0.13,
    names: {
      en: 'Rigel',
      tr: 'Rigel',
      de: 'Rigel',
      fr: 'Rigel',
      es: 'Rigel',
      ar: 'رجل الجبار',
      it: 'Rigel',
      pt: 'Rigel'
    }
  },
  {
    id: 'procyon',
    ra: 7.66,
    dec: 5.22,
    mag: 0.34,
    names: {
      en: 'Procyon',
      tr: 'Procyon',
      de: 'Prokyon',
      fr: 'Procyon',
      es: 'Proción',
      ar: 'الشعرى الشامية',
      it: 'Procione',
      pt: 'Prócion'
    }
  },
  {
    id: 'achernar',
    ra: 1.63,
    dec: -57.24,
    mag: 0.46,
    names: {
      en: 'Achernar',
      tr: 'Ahirnahr',
      de: 'Achernar',
      fr: 'Achernar',
      es: 'Achernar',
      ar: 'آخر النهر',
      it: 'Achernar',
      pt: 'Achernar'
    }
  },
  {
    id: 'betelgeuse',
    ra: 5.92,
    dec: 7.41,
    mag: 0.5,
    names: {
      en: 'Betelgeuse',
      tr: 'İkizler omzu (Betelgeuse)',
      de: 'Beteigeuze',
      fr: 'Bételgeuse',
      es: 'Betelgeuse',
      ar: 'إبط الجوزاء',
      it: 'Betelgeuse',
      pt: 'Betelgeuse'
    }
  },
  {
    id: 'hadar',
    ra: 14.06,
    dec: -60.37,
    mag: 0.61,
    names: {
      en: 'Hadar',
      tr: 'Hadar',
      de: 'Hadar',
      fr: 'Hadar',
      es: 'Hadar',
      ar: 'حضار',
      it: 'Hadar',
      pt: 'Hadar'
    }
  },
  {
    id: 'altair',
    ra: 19.85,
    dec: 8.87,
    mag: 0.76,
    names: {
      en: 'Altair',
      tr: 'Altair',
      de: 'Altair',
      fr: 'Altaïr',
      es: 'Altair',
      ar: 'النسر الطائر',
      it: 'Altair',
      pt: 'Altair'
    }
  },
  {
    id: 'aldebaran',
    ra: 4.6,
    dec: 16.51,
    mag: 0.85,
    names: {
      en: 'Aldebaran',
      tr: 'Aldebaran',
      de: 'Aldebaran',
      fr: 'Aldébaran',
      es: 'Aldebarán',
      ar: 'الدبران',
      it: 'Aldebaran',
      pt: 'Aldebaran'
    }
  },
  {
    id: 'spica',
    ra: 13.42,
    dec: -11.16,
    mag: 0.98,
    names: {
      en: 'Spica',
      tr: 'Spika Başak',
      de: 'Spica',
      fr: 'Épi',
      es: 'Espiga',
      ar: 'السماك الأعزل',
      it: 'Spica',
      pt: 'Spica'
    }
  },
  {
    id: 'antares',
    ra: 16.49,
    dec: -26.43,
    mag: 1.05,
    names: {
      en: 'Antares',
      tr: 'Akrep Kalbi (Antares)',
      de: 'Antares',
      fr: 'Antarès',
      es: 'Antares',
      ar: 'قلب العقرب',
      it: 'Antares',
      pt: 'Antares'
    }
  },
  {
    id: 'pollux',
    ra: 7.75,
    dec: 28.03,
    mag: 1.14,
    names: {
      en: 'Pollux',
      tr: 'Poluks',
      de: 'Pollux',
      fr: 'Pollux',
      es: 'Pólux',
      ar: 'رأس التوأم المؤخر',
      it: 'Polluce',
      pt: 'Pollux'
    }
  },
  {
    id: 'fomalhaut',
    ra: 22.96,
    dec: -29.62,
    mag: 1.16,
    names: {
      en: 'Fomalhaut',
      tr: 'Fomalhaut',
      de: 'Fomalhaut',
      fr: 'Fomalhaut',
      es: 'Fomalhaut',
      ar: 'فم الحوت',
      it: 'Fomalhaut',
      pt: 'Fomalhaut'
    }
  },
  {
    id: 'deneb',
    ra: 20.69,
    dec: 45.28,
    mag: 1.25,
    names: {
      en: 'Deneb',
      tr: 'Deneb',
      de: 'Deneb',
      fr: 'Deneb',
      es: 'Deneb',
      ar: 'ذنب الدجاجة',
      it: 'Deneb',
      pt: 'Deneb'
    }
  },
  {
    id: 'regulus',
    ra: 10.14,
    dec: 11.97,
    mag: 1.35,
    names: {
      en: 'Regulus',
      tr: 'Aslan Kalbi (Regulus)',
      de: 'Regulus',
      fr: 'Régulus',
      es: 'Régulo',
      ar: 'الملكي (قلب الأسد)',
      it: 'Regolo',
      pt: 'Régulus'
    }
  },
  {
    id: 'castor',
    ra: 7.58,
    dec: 31.89,
    mag: 1.58,
    names: {
      en: 'Castor',
      tr: 'Kastor',
      de: 'Castor',
      fr: 'Castor',
      es: 'Cástor',
      ar: 'رأس التوأم المقدم',
      it: 'Castore',
      pt: 'Castor'
    }
  },
  {
    id: 'shaula',
    ra: 17.56,
    dec: -37.1,
    mag: 1.62,
    names: {
      en: 'Shaula',
      tr: 'Şaula',
      de: 'Shaula',
      fr: 'Shaula',
      es: 'Shaula',
      ar: 'الشولة',
      it: 'Shaula',
      pt: 'Shaula'
    }
  },
  {
    id: 'bellatrix',
    ra: 5.42,
    dec: 6.35,
    mag: 1.64,
    names: {
      en: 'Bellatrix',
      tr: 'Bellatriks',
      de: 'Bellatrix',
      fr: 'Bellatrix',
      es: 'Bellatrix',
      ar: 'ناجذ (المرزم)',
      it: 'Bellatrix',
      pt: 'Bellatrix'
    }
  },
  {
    id: 'elnath',
    ra: 5.43,
    dec: 28.6,
    mag: 1.65,
    names: {
      en: 'Elnath',
      tr: 'El-Nat',
      de: 'Elnath',
      fr: 'Elnath',
      es: 'Elnath',
      ar: 'النطح',
      it: 'Elnath',
      pt: 'Elnath'
    }
  },
  {
    id: 'alnilam',
    ra: 5.6,
    dec: -1.2,
    mag: 1.69,
    names: {
      en: 'Alnilam',
      tr: 'Alnilam (Orion Kuşağı)',
      de: 'Alnilam',
      fr: 'Alnilam',
      es: 'Alnilam',
      ar: 'النظام',
      it: 'Alnilam',
      pt: 'Alnilam'
    }
  },
  {
    id: 'alnitak',
    ra: 5.68,
    dec: -1.94,
    mag: 1.74,
    names: {
      en: 'Alnitak',
      tr: 'Alnitak',
      de: 'Alnitak',
      fr: 'Alnitak',
      es: 'Alnitak',
      ar: 'النطاق',
      it: 'Alnitak',
      pt: 'Alnitak'
    }
  },
  {
    id: 'mintaka',
    ra: 5.53,
    dec: -0.3,
    mag: 2.23,
    names: {
      en: 'Mintaka',
      tr: 'Mintaka',
      de: 'Mintaka',
      fr: 'Mintaka',
      es: 'Mintaka',
      ar: 'المنطقة',
      it: 'Mintaka',
      pt: 'Mintaka'
    }
  },
  {
    id: 'saiph',
    ra: 5.79,
    dec: -9.67,
    mag: 2.06,
    names: {
      en: 'Saiph',
      tr: 'Seyf',
      de: 'Saiph',
      fr: 'Saiph',
      es: 'Saiph',
      ar: 'سيف الجبار',
      it: 'Saiph',
      pt: 'Saiph'
    }
  },
  // Ursa Major (Big Dipper)
  {
    id: 'dubhe',
    ra: 11.06,
    dec: 61.75,
    mag: 1.81,
    names: {
      en: 'Dubhe',
      tr: 'Dubhe',
      de: 'Dubhe',
      fr: 'Dubhe',
      es: 'Dubhe',
      ar: 'دبة',
      it: 'Dubhe',
      pt: 'Dubhe'
    }
  },
  {
    id: 'merak',
    ra: 11.03,
    dec: 56.38,
    mag: 2.34,
    names: {
      en: 'Merak',
      tr: 'Merak',
      de: 'Merak',
      fr: 'Merak',
      es: 'Merak',
      ar: 'المراق',
      it: 'Merak',
      pt: 'Merak'
    }
  },
  {
    id: 'phecda',
    ra: 11.89,
    dec: 53.69,
    mag: 2.41,
    names: {
      en: 'Phecda',
      tr: 'Fekda',
      de: 'Phecda',
      fr: 'Phecda',
      es: 'Phecda',
      ar: 'فخذ',
      it: 'Phecda',
      pt: 'Phecda'
    }
  },
  {
    id: 'megrez',
    ra: 12.25,
    dec: 57.03,
    mag: 3.32,
    names: {
      en: 'Megrez',
      tr: 'Megrez',
      de: 'Megrez',
      fr: 'Megrez',
      es: 'Megrez',
      ar: 'المغرز',
      it: 'Megrez',
      pt: 'Megrez'
    }
  },
  {
    id: 'alioth',
    ra: 12.9,
    dec: 55.96,
    mag: 1.76,
    names: {
      en: 'Alioth',
      tr: 'Aliyot',
      de: 'Alioth',
      fr: 'Alioth',
      es: 'Alioth',
      ar: 'الإلية',
      it: 'Alioth',
      pt: 'Alioth'
    }
  },
  {
    id: 'mizar',
    ra: 13.4,
    dec: 54.92,
    mag: 2.23,
    names: {
      en: 'Mizar',
      tr: 'Mizar',
      de: 'Mizar',
      fr: 'Mizar',
      es: 'Mizar',
      ar: 'المئزر',
      it: 'Mizar',
      pt: 'Mizar'
    }
  },
  {
    id: 'alkaid',
    ra: 13.79,
    dec: 49.31,
    mag: 1.85,
    names: {
      en: 'Alkaid',
      tr: 'El-Kaid',
      de: 'Alkaid',
      fr: 'Alkaid',
      es: 'Alkaid',
      ar: 'القائد',
      it: 'Alkaid',
      pt: 'Alkaid'
    }
  },
  // Cassiopeia
  {
    id: 'schedar',
    ra: 0.68,
    dec: 56.54,
    mag: 2.24,
    names: {
      en: 'Schedar',
      tr: 'Sedir',
      de: 'Schedar',
      fr: 'Schedar',
      es: 'Schedar',
      ar: 'صدر',
      it: 'Schedar',
      pt: 'Schedar'
    }
  },
  {
    id: 'caph',
    ra: 0.15,
    dec: 59.15,
    mag: 2.28,
    names: {
      en: 'Caph',
      tr: 'Kaf',
      de: 'Caph',
      fr: 'Caph',
      es: 'Caph',
      ar: 'الكف الخصيب',
      it: 'Caph',
      pt: 'Caph'
    }
  },
  {
    id: 'gammacas',
    ra: 0.95,
    dec: 60.72,
    mag: 2.15,
    names: {
      en: 'Tsih (Gamma Cas)',
      tr: 'Sih (Gama Koltuk)',
      de: 'Tsih',
      fr: 'Tsih',
      es: 'Tsih',
      ar: 'الغميصاء (جاما ذات الكرسي)',
      it: 'Tsih',
      pt: 'Tsih'
    }
  },
  {
    id: 'ruchbah',
    ra: 1.43,
    dec: 60.23,
    mag: 2.66,
    names: {
      en: 'Ruchbah',
      tr: 'Rukbah',
      de: 'Ruchbah',
      fr: 'Ruchbah',
      es: 'Ruchbah',
      ar: 'الركبة',
      it: 'Ruchbah',
      pt: 'Ruchbah'
    }
  },
  {
    id: 'segin',
    ra: 1.9,
    dec: 63.67,
    mag: 3.37,
    names: {
      en: 'Segin',
      tr: 'Segin',
      de: 'Segin',
      fr: 'Segin',
      es: 'Segin',
      ar: 'سيجين',
      it: 'Segin',
      pt: 'Segin'
    }
  },
  // Leo (Lion)
  {
    id: 'denebola',
    ra: 11.82,
    dec: 14.57,
    mag: 2.14,
    names: {
      en: 'Denebola',
      tr: 'Denebola',
      de: 'Denebola',
      fr: 'Denebola',
      es: 'Denebola',
      ar: 'ذنب الأسد',
      it: 'Denebola',
      pt: 'Denebola'
    }
  },
  {
    id: 'algieba',
    ra: 10.33,
    dec: 19.84,
    mag: 2.01,
    names: {
      en: 'Algieba',
      tr: 'Algeba',
      de: 'Algieba',
      fr: 'Algieba',
      es: 'Algieba',
      ar: 'الجبهة',
      it: 'Algieba',
      pt: 'Algieba'
    }
  },
  {
    id: 'zosma',
    ra: 11.23,
    dec: 20.52,
    mag: 2.56,
    names: {
      en: 'Zosma',
      tr: 'Zosma',
      de: 'Zosma',
      fr: 'Zosma',
      es: 'Zosma',
      ar: 'الضفيرة',
      it: 'Zosma',
      pt: 'Zosma'
    }
  },
  {
    id: 'chertan',
    ra: 11.23,
    dec: 15.43,
    mag: 3.33,
    names: {
      en: 'Chertan',
      tr: 'Hortan',
      de: 'Chertan',
      fr: 'Chertan',
      es: 'Chertan',
      ar: 'الخرتان',
      it: 'Chertan',
      pt: 'Chertan'
    }
  },
  {
    id: 'rasalas',
    ra: 9.88,
    dec: 26.0,
    mag: 3.43,
    names: {
      en: 'Rasalas',
      tr: 'Rasalas',
      de: 'Rasalas',
      fr: 'Rasalas',
      es: 'Rasalas',
      ar: 'رأس الأسد الشمالي',
      it: 'Rasalas',
      pt: 'Rasalas'
    }
  },
  // Cygnus (Swan / Northern Cross)
  {
    id: 'sadr',
    ra: 20.37,
    dec: 40.26,
    mag: 2.23,
    names: {
      en: 'Sadr',
      tr: 'Sadr',
      de: 'Sadr',
      fr: 'Sadr',
      es: 'Sadr',
      ar: 'الصدر',
      it: 'Sadr',
      pt: 'Sadr'
    }
  },
  {
    id: 'gienah',
    ra: 20.77,
    dec: 33.97,
    mag: 2.48,
    names: {
      en: 'Gienah',
      tr: 'Cenah',
      de: 'Gienah',
      fr: 'Gienah',
      es: 'Gienah',
      ar: 'الجناح',
      it: 'Gienah',
      pt: 'Gienah'
    }
  },
  {
    id: 'fawaris',
    ra: 19.6,
    dec: 45.13,
    mag: 2.87,
    names: {
      en: 'Fawaris',
      tr: 'Faris',
      de: 'Fawaris',
      fr: 'Fawaris',
      es: 'Fawaris',
      ar: 'الفوارس',
      it: 'Fawaris',
      pt: 'Fawaris'
    }
  },
  {
    id: 'albireo',
    ra: 19.51,
    dec: 27.96,
    mag: 3.05,
    names: {
      en: 'Albireo',
      tr: 'Albireo',
      de: 'Albireo',
      fr: 'Albireo',
      es: 'Albireo',
      ar: 'منقار الدجاجة',
      it: 'Albireo',
      pt: 'Albireo'
    }
  },
  // Pegasus
  {
    id: 'markab',
    ra: 23.08,
    dec: 15.2,
    mag: 2.49,
    names: {
      en: 'Markab',
      tr: 'Merkep',
      de: 'Markab',
      fr: 'Markab',
      es: 'Markab',
      ar: 'مركب',
      it: 'Markab',
      pt: 'Markab'
    }
  },
  {
    id: 'scheat',
    ra: 23.06,
    dec: 28.08,
    mag: 2.44,
    names: {
      en: 'Scheat',
      tr: 'Şeat',
      de: 'Scheat',
      fr: 'Scheat',
      es: 'Scheat',
      ar: 'الساعد',
      it: 'Scheat',
      pt: 'Scheat'
    }
  },
  {
    id: 'algenib',
    ra: 0.22,
    dec: 15.18,
    mag: 2.83,
    names: {
      en: 'Algenib',
      tr: 'El-Cenib',
      de: 'Algenib',
      fr: 'Algenib',
      es: 'Algenib',
      ar: 'الجانب',
      it: 'Algenib',
      pt: 'Algenib'
    }
  },
  {
    id: 'alpheratz',
    ra: 0.14,
    dec: 29.09,
    mag: 2.06,
    names: {
      en: 'Alpheratz',
      tr: 'Alferatz',
      de: 'Alpheratz',
      fr: 'Alpheratz',
      es: 'Alferatz',
      ar: 'سرّة الفرس',
      it: 'Alpheratz',
      pt: 'Alpheratz'
    }
  },
  // Andromeda
  {
    id: 'mirach',
    ra: 1.16,
    dec: 35.62,
    mag: 2.07,
    names: {
      en: 'Mirach',
      tr: 'Miraç',
      de: 'Mirach',
      fr: 'Mirach',
      es: 'Mirach',
      ar: 'المئزر (مراق)',
      it: 'Mirach',
      pt: 'Mirach'
    }
  },
  {
    id: 'almach',
    ra: 2.06,
    dec: 42.33,
    mag: 2.1,
    names: {
      en: 'Almach',
      tr: 'Almak',
      de: 'Almach',
      fr: 'Almach',
      es: 'Almach',
      ar: 'عناق الأرض',
      it: 'Almach',
      pt: 'Almach'
    }
  },
  // Aries
  {
    id: 'hamal',
    ra: 2.12,
    dec: 23.46,
    mag: 2.01,
    names: {
      en: 'Hamal',
      tr: 'Hamal (Koç Baş Yıldızı)',
      de: 'Hamal',
      fr: 'Hamal',
      es: 'Hamal',
      ar: 'الناطح (الحمل)',
      it: 'Hamal',
      pt: 'Hamal'
    }
  },
  {
    id: 'sheratan',
    ra: 1.91,
    dec: 20.8,
    mag: 2.64,
    names: {
      en: 'Sheratan',
      tr: 'Şeratan',
      de: 'Sheratan',
      fr: 'Sheratan',
      es: 'Sheratan',
      ar: 'الشرطين',
      it: 'Sheratan',
      pt: 'Sheratan'
    }
  },
  {
    id: 'mesarthim',
    ra: 1.89,
    dec: 19.29,
    mag: 3.88,
    names: {
      en: 'Mesarthim',
      tr: 'Mesartim',
      de: 'Mesarthim',
      fr: 'Mesarthim',
      es: 'Mesarthim',
      ar: 'المؤخر',
      it: 'Mesarthim',
      pt: 'Mesarthim'
    }
  }
];

export interface DSO {
  id: string;
  ra: number;  // Right Ascension in hours
  dec: number; // Declination in degrees
  type: 'galaxy' | 'nebula' | 'cluster';
  messier: string;
  names: Record<string, string>;
  subtitle: Record<string, string>;
  desc: Record<string, string>;
}

export const dsoList: DSO[] = [
  {
    id: 'm31',
    ra: 0.712,
    dec: 41.27,
    type: 'galaxy',
    messier: 'M31',
    names: { en: 'Andromeda Galaxy', tr: 'Andromeda Galaksisi', de: 'Andromeda-Galaxie', fr: 'Galaxie d\'Andromède', es: 'Galaxia de Andrómeda', ar: 'مجرة أندروميدا', it: 'Galassia di Andromeda', pt: 'Galáxia de Andrômeda' },
    subtitle: { en: 'Spiral Galaxy', tr: 'Sarmal Galaksi', de: 'Spiralgalaxie', fr: 'Galaxie Spirale', es: 'Galaxia Espiral', ar: 'مجرة حلزونية', it: 'Galassia Spirale', pt: 'Galáxia Espiral' },
    desc: {
      tr: 'Samanyolu\'na en yakın büyük sarmal galaksi. Yaklaşık 2.5 milyon ışık yılı uzaklıktadır ve çıplak gözle sönük bir bulut gibi görülebilir.',
      en: 'The nearest major spiral galaxy to the Milky Way, located about 2.5 million light-years away. It can be seen as a faint smudge with the naked eye.',
      de: 'Die der Milchstraße am nächsten gelegene spiralförmige Galaxie, etwa 2,5 Millionen Lichtjahre entfernt. Mit bloßem Auge als schwacher Fleck erkennbar.'
    }
  },
  {
    id: 'm42',
    ra: 5.588,
    dec: -5.38,
    type: 'nebula',
    messier: 'M42',
    names: { en: 'Orion Nebula', tr: 'Orion Bulutsusu', de: 'Orionnebel', fr: 'Nébuleuse d\'Orion', es: 'Nebulosa de Orión', ar: 'سديم الجبار', it: 'Nebulosa di Orione', pt: 'Nebulosa de Órion' },
    subtitle: { en: 'Emission Nebula', tr: 'Salım Bulutsusu', de: 'Emissionsnebel', fr: 'Nébuleuse d\'Émission', es: 'Nebulosa de Emisión', ar: 'سديم انبعاثي', it: 'Nebulosa a Emissione', pt: 'Nebulosa de Emissão' },
    desc: {
      tr: 'Avcı takımyıldızının kuşağının altında yer alan devasa bir yıldız oluşum bölgesi. Gökyüzündeki en parlak bulutsulardan biridir.',
      en: 'A massive star-forming region located below Orion\'s belt. It is one of the brightest nebulae in the night sky.',
      de: 'Ein massives Sternentstehungsgebiet unterhalb des Oriongürtels. Es ist einer der hellsten Nebel am Nachthimmel.'
    }
  },
  {
    id: 'm45',
    ra: 3.783,
    dec: 24.12,
    type: 'cluster',
    messier: 'M45',
    names: { en: 'Pleiades (Seven Sisters)', tr: 'Pleiades (Ülker Yıldız Kümesi)', de: 'Plejaden', fr: 'Pléiades', es: 'Pléyades', ar: 'الثريا', it: 'Pleiadi', pt: 'Plêiades' },
    subtitle: { en: 'Open Cluster', tr: 'Açık Yıldız Kümesi', de: 'Offener Sternhaufen', fr: 'Amas Ouvert', es: 'Cúmulo Abierto', ar: 'عنقود نجمي مفتوح', it: 'Ammasso Aperto', pt: 'Aglomerado Aberto' },
    desc: {
      tr: 'Boğa takımyıldızında yer alan, çıplak gözle kolayca görülebilen çok belirgin bir açık yıldız kümesi. Mavi renkli sıcak genç yıldızlardan oluşur.',
      en: 'A prominent open star cluster in Taurus, easily visible to the naked eye. Composed of hot, young blue stars surrounded by reflection nebulae.',
      de: 'Ein markanter offener Sternhaufen im Stier, leicht mit bloßem Auge zu sehen. Besteht aus heißen, jungen blauen Sternen.'
    }
  },
  {
    id: 'm13',
    ra: 16.695,
    dec: 36.46,
    type: 'cluster',
    messier: 'M13',
    names: { en: 'Hercules Globular Cluster', tr: 'Herkül Küresel Kümesi', de: 'Herkules-Kugelhaufen', fr: 'Amas d\'Hercule', es: 'Cúmulo de Hércules', ar: 'عنقود الجاثي المغلق', it: 'Ammasso Globulare di Ercole', pt: 'Aglomerado Globular de Hércules' },
    subtitle: { en: 'Globular Cluster', tr: 'Küresel Yıldız Kümesi', de: 'Kugelhaufen', fr: 'Amas Globulaire', es: 'Cúmulo Globular', ar: 'عنقود مغلق', it: 'Ammasso Globulare', pt: 'Aglomerado Globular' },
    desc: {
      tr: 'Kuzey yarımkürenin en parlak ve en bilinen küresel yıldız kümelerinden biri. Yüz binlerce yaşlı yıldızı barındırır.',
      en: 'One of the brightest and best-known globular clusters in the northern sky, containing hundreds of thousands of ancient stars.',
      de: 'Einer der hellsten und bekanntesten Kugelhaufen am Nordhimmel, der Hunderttausende uralter Sterne beherbergt.'
    }
  },
  {
    id: 'm57',
    ra: 18.893,
    dec: 33.03,
    type: 'nebula',
    messier: 'M57',
    names: { en: 'Ring Nebula', tr: 'Halka Bulutsusu', de: 'Ringnebel', fr: 'Nébuleuse de la Lyre', es: 'Nebulosa de la Lira', ar: 'سديم الحلقة', it: 'Nebulosa Anello', pt: 'Nebulosa do Anel' },
    subtitle: { en: 'Planetary Nebula', tr: 'Gezegenimsi Bulutsu', de: 'Planetarischer Nebel', fr: 'Nébuleuse Planétaire', es: 'Nebulosa Planetaria', ar: 'سديم كوكبي', it: 'Nebulosa Planetaria', pt: 'Nebulosa Planetária' },
    desc: {
      tr: 'Çalgı takımyıldızında yer alan ünlü bir gezegenimsi bulutsu. Ömrünün sonuna gelen bir yıldızın dış katmanlarını uzaya fırlatmasıyla oluşmuştur.',
      en: 'A famous planetary nebula in the Lyra constellation. Formed when a dying star cast off its outer layers of ionized gas into space.',
      de: 'Ein berühmter planetarischer Nebel im Sternbild Leier. Entstanden, als ein sterbender Stern seine äußeren Gashüllen in den Weltraum stieß.'
    }
  }
];

export const constellations: Constellation[] = [
  {
    id: 'orion',
    names: {
      en: 'Orion (The Hunter)',
      tr: 'Avcı (Orion)',
      de: 'Orion (Jäger)',
      fr: 'Orion (Le Chasseur)',
      es: 'Orión (El Cazador)',
      ar: 'الجبار (الصياد)',
      it: 'Orione (Il Cacciatore)',
      pt: 'Orion (O Caçador)'
    },
    connections: [
      ['betelgeuse', 'bellatrix'],
      ['bellatrix', 'mintaka'],
      ['mintaka', 'alnilam'],
      ['alnilam', 'alnitak'],
      ['alnitak', 'rigel'],
      ['rigel', 'saiph'],
      ['saiph', 'betelgeuse'],
      ['betelgeuse', 'alnilam'], // belt connect
      ['saiph', 'alnitak'],
      ['bellatrix', 'rigel']
    ]
  },
  {
    id: 'ursa_major',
    names: {
      en: 'Ursa Major (Big Dipper)',
      tr: 'Büyük Ayı',
      de: 'Ursa Major (Großer Bär)',
      fr: 'Grande Ourse',
      es: 'Osa Mayor',
      ar: 'الدب الأكبر',
      it: 'Orsa Maggiore',
      pt: 'Ursa Maior'
    },
    connections: [
      ['dubhe', 'merak'],
      ['merak', 'phecda'],
      ['phecda', 'megrez'],
      ['megrez', 'dubhe'], // cup completed
      ['megrez', 'alioth'],
      ['alioth', 'mizar'],
      ['mizar', 'alkaid'] // tail completed
    ]
  },
  {
    id: 'cassiopeia',
    names: {
      en: 'Cassiopeia',
      tr: 'Koltuk (Kraliçe)',
      de: 'Kassiopeia',
      fr: 'Cassiopée',
      es: 'Casiopea',
      ar: 'ذات الكرسي',
      it: 'Cassiopea',
      pt: 'Cassiopeia'
    },
    connections: [
      ['schedar', 'caph'],
      ['schedar', 'gammacas'],
      ['gammacas', 'ruchbah'],
      ['ruchbah', 'segin'] // W shape completed
    ]
  },
  {
    id: 'leo',
    names: {
      en: 'Leo (The Lion)',
      tr: 'Aslan (Leo)',
      de: 'Löwe (Leo)',
      fr: 'Lion (Leo)',
      es: 'Leo (El León)',
      ar: 'الأسد',
      it: 'Leone (Leo)',
      pt: 'Leão (Leo)'
    },
    connections: [
      ['regulus', 'algieba'],
      ['algieba', 'rasalas'],
      ['algieba', 'zosma'],
      ['zosma', 'denebola'],
      ['denebola', 'chertan'],
      ['chertan', 'regulus'], // main body completed
      ['zosma', 'chertan']
    ]
  },
  {
    id: 'gemini',
    names: {
      en: 'Gemini (The Twins)',
      tr: 'İkizler (Gemini)',
      de: 'Zwillinge (Gemini)',
      fr: 'Gémeaux (Gemini)',
      es: 'Géminis (Los Gemelos)',
      ar: 'التوأمان (الجوزاء)',
      it: 'Gemelli (Gemini)',
      pt: 'Gêmeos (Gemini)'
    },
    connections: [
      ['castor', 'pollux'],
      ['castor', 'procyon'], // Connect cast to nearby procyon for visual outline in constellations
      ['pollux', 'procyon']
    ]
  },
  {
    id: 'cygnus',
    names: {
      en: 'Cygnus (The Swan / Northern Cross)',
      tr: 'Kuğu (Cygnus)',
      de: 'Schwan (Cygnus)',
      fr: 'Cygne (Northern Cross)',
      es: 'Cisne (Cruz del Norte)',
      ar: 'الدجاجة',
      it: 'Cigno (Cygnus)',
      pt: 'Cisne (Cygnus)'
    },
    connections: [
      ['deneb', 'sadr'],
      ['sadr', 'albireo'], // body spine
      ['sadr', 'gienah'], // left wing
      ['sadr', 'fawaris'] // right wing
    ]
  },
  {
    id: 'taurus',
    names: {
      en: 'Taurus (The Bull)',
      tr: 'Boğa (Taurus)',
      de: 'Stier (Taurus)',
      fr: 'Taureau (Taurus)',
      es: 'Tauro (El Toro)',
      ar: 'الثور',
      it: 'Toro (Taurus)',
      pt: 'Touro (Taurus)'
    },
    connections: [
      ['aldebaran', 'elnath'],
      ['aldebaran', 'capella'] // Visual connect to Auriga for grid outline
    ]
  },
  {
    id: 'pegasus',
    names: {
      en: 'Pegasus',
      tr: 'Kanatlı At (Pegasus)',
      de: 'Pegasus',
      fr: 'Pégase',
      es: 'Pegaso',
      ar: 'الفرس الأعظم',
      it: 'Pegaso',
      pt: 'Pégaso'
    },
    connections: [
      ['markab', 'scheat'],
      ['scheat', 'alpheratz'],
      ['alpheratz', 'algenib'],
      ['algenib', 'markab'] // Pegasus Great Square
    ]
  },
  {
    id: 'andromeda',
    names: {
      en: 'Andromeda',
      tr: 'Andromeda',
      de: 'Andromeda',
      fr: 'Andromède',
      es: 'Andrómedda',
      ar: 'المرأة المسلسلة',
      it: 'Andromeda',
      pt: 'Andrômeda'
    },
    connections: [
      ['alpheratz', 'mirach'],
      ['mirach', 'almach'] // Chain extending from Pegasus square
    ]
  },
  {
    id: 'aries',
    names: {
      en: 'Aries (The Ram)',
      tr: 'Koç (Aries)',
      de: 'Widder (Aries)',
      fr: 'Bélier (Aries)',
      es: 'Aries (El Carnero)',
      ar: 'الحمل',
      it: 'Ariete (Aries)',
      pt: 'Áries (Aries)'
    },
    connections: [
      ['hamal', 'sheratan'],
      ['sheratan', 'mesarthim'] // Simple arch
    ]
  }
];
