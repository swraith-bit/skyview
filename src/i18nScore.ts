import { LangCode } from './i18n';

const en = {
  why: 'Why this score?', title: 'Score details', general: 'General', planetary: 'Planets', deepSky: 'Deep sky', meteor: 'Meteors',
  confidence: 'Forecast confidence', high: 'High', medium: 'Medium', low: 'Low', cloud: 'Cloud cover', moon: 'Moonlight', darkness: 'Sky darkness', targets: 'Visible targets', wind: 'Wind', humidity: 'Humidity', note: 'Each target type weighs the same conditions differently.', close: 'Close details',
} as const;
type ScoreKey = keyof typeof en;
type ScoreMessages = Record<ScoreKey, string>;

const catalog: Record<LangCode, ScoreMessages> = {
  en,
  tr: { why: 'Bu skor neden?', title: 'Skor ayrıntıları', general: 'Genel', planetary: 'Gezegenler', deepSky: 'Derin uzay', meteor: 'Meteorlar', confidence: 'Tahmin güveni', high: 'Yüksek', medium: 'Orta', low: 'Düşük', cloud: 'Bulut örtüsü', moon: 'Ay ışığı', darkness: 'Gökyüzü karanlığı', targets: 'Görünür hedefler', wind: 'Rüzgâr', humidity: 'Nem', note: 'Her hedef türü aynı koşulları farklı ağırlıklarla değerlendirir.', close: 'Ayrıntıları kapat' },
  de: { why: 'Warum dieser Wert?', title: 'Wertdetails', general: 'Allgemein', planetary: 'Planeten', deepSky: 'Deep Sky', meteor: 'Meteore', confidence: 'Vorhersagevertrauen', high: 'Hoch', medium: 'Mittel', low: 'Niedrig', cloud: 'Bewölkung', moon: 'Mondlicht', darkness: 'Himmelsdunkelheit', targets: 'Sichtbare Ziele', wind: 'Wind', humidity: 'Feuchtigkeit', note: 'Jeder Zieltyp gewichtet dieselben Bedingungen anders.', close: 'Details schließen' },
  fr: { why: 'Pourquoi ce score ?', title: 'Détails du score', general: 'Général', planetary: 'Planètes', deepSky: 'Ciel profond', meteor: 'Météores', confidence: 'Fiabilité', high: 'Élevée', medium: 'Moyenne', low: 'Faible', cloud: 'Nuages', moon: 'Clair de lune', darkness: 'Obscurité du ciel', targets: 'Cibles visibles', wind: 'Vent', humidity: 'Humidité', note: 'Chaque type de cible pondère différemment les mêmes conditions.', close: 'Fermer les détails' },
  es: { why: '¿Por qué esta puntuación?', title: 'Detalles de puntuación', general: 'General', planetary: 'Planetas', deepSky: 'Cielo profundo', meteor: 'Meteoros', confidence: 'Confianza del pronóstico', high: 'Alta', medium: 'Media', low: 'Baja', cloud: 'Nubosidad', moon: 'Luz lunar', darkness: 'Oscuridad del cielo', targets: 'Objetivos visibles', wind: 'Viento', humidity: 'Humedad', note: 'Cada tipo de objetivo pondera las condiciones de forma diferente.', close: 'Cerrar detalles' },
  ar: { why: 'لماذا هذه النتيجة؟', title: 'تفاصيل النتيجة', general: 'عام', planetary: 'الكواكب', deepSky: 'السماء العميقة', meteor: 'الشهب', confidence: 'موثوقية التوقع', high: 'عالية', medium: 'متوسطة', low: 'منخفضة', cloud: 'السحب', moon: 'ضوء القمر', darkness: 'ظلمة السماء', targets: 'الأهداف المرئية', wind: 'الرياح', humidity: 'الرطوبة', note: 'يقيّم كل نوع من الأهداف الظروف نفسها بأوزان مختلفة.', close: 'إغلاق التفاصيل' },
  it: { why: 'Perché questo punteggio?', title: 'Dettagli punteggio', general: 'Generale', planetary: 'Pianeti', deepSky: 'Cielo profondo', meteor: 'Meteore', confidence: 'Affidabilità previsione', high: 'Alta', medium: 'Media', low: 'Bassa', cloud: 'Nuvole', moon: 'Luce lunare', darkness: 'Oscurità del cielo', targets: 'Bersagli visibili', wind: 'Vento', humidity: 'Umidità', note: 'Ogni tipo di bersaglio pesa diversamente le stesse condizioni.', close: 'Chiudi dettagli' },
  pt: { why: 'Porquê esta pontuação?', title: 'Detalhes da pontuação', general: 'Geral', planetary: 'Planetas', deepSky: 'Céu profundo', meteor: 'Meteoros', confidence: 'Confiança da previsão', high: 'Alta', medium: 'Média', low: 'Baixa', cloud: 'Nuvens', moon: 'Luar', darkness: 'Escuridão do céu', targets: 'Alvos visíveis', wind: 'Vento', humidity: 'Humidade', note: 'Cada tipo de alvo pondera as mesmas condições de forma diferente.', close: 'Fechar detalhes' },
};

export const scoreT = (key: ScoreKey, lang: LangCode): string => catalog[lang][key];
