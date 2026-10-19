import { SuitabilityStatus } from './types';
import { extraTranslations } from './i18nExtra';
import type { TranslationMap, TranslationNode } from './i18nTypes';
import en from './locales/en';

export type LangCode = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ar' | 'it' | 'pt';
export type { TranslationMap } from './i18nTypes';

export const languageCodes: LangCode[] = ['en', 'tr', 'de', 'fr', 'es', 'ar', 'it', 'pt'];
export const isLangCode = (value: unknown): value is LangCode => typeof value === 'string' && languageCodes.includes(value as LangCode);

export const translations: Partial<Record<LangCode, TranslationMap>> = { en };

const localeLoaders: Record<Exclude<LangCode, 'en'>, () => Promise<{ default: TranslationMap }>> = {
  tr: () => import('./locales/tr'),
  de: () => import('./locales/de'),
  fr: () => import('./locales/fr'),
  es: () => import('./locales/es'),
  ar: () => import('./locales/ar'),
  it: () => import('./locales/it'),
  pt: () => import('./locales/pt'),
};

const pendingLoads = new Map<LangCode, Promise<void>>();

export const loadLanguage = (lang: LangCode): Promise<void> => {
  if (translations[lang]) return Promise.resolve();
  const pending = pendingLoads.get(lang);
  if (pending) return pending;
  if (lang === 'en') return Promise.resolve();
  const loading = localeLoaders[lang]().then(module => {
    translations[lang] = module.default;
    pendingLoads.delete(lang);
  }).catch(error => {
    pendingLoads.delete(lang);
    throw error;
  });
  pendingLoads.set(lang, loading);
  return loading;
};

export const initializeI18n = async (lang: LangCode): Promise<void> => {
  await loadLanguage(lang);
};

export const loadAllTranslations = async (): Promise<Record<LangCode, TranslationMap>> => {
  await Promise.all(languageCodes.map(loadLanguage));
  return translations as Record<LangCode, TranslationMap>;
};

const isTranslationMap = (value: TranslationNode | undefined): value is TranslationMap => (
  typeof value === 'object' && value !== null
);

const apodStatusMessages: Partial<Record<LangCode, Record<string, string>>> = {
  en: {
    'apod.offlineMsg': 'NASA APOD could not be reached. Check your connection and try again.',
    'apod.rateLimitMsg': 'NASA APOD request limit was reached for this API key.',
    'apod.authMsg': 'NASA APOD API key was rejected. Check the app configuration.',
    'apod.timeoutMsg': 'NASA APOD took too long to respond.',
    'apod.serverMsg': 'NASA APOD is temporarily unavailable.',
    'apod.cooldownMsg': 'Recently refreshed. Keeping the saved APOD to avoid unnecessary API requests.',
    'apod.showingCached': 'Showing the last saved APOD.',
    'apod.showingArchive': 'Showing the local stargazing archive.',
  },
  tr: {
    'apod.offlineMsg': 'NASA APOD verisine ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
    'apod.rateLimitMsg': 'Bu NASA API anahtarı için APOD istek limiti doldu.',
    'apod.authMsg': 'NASA APOD API anahtarı kabul edilmedi. Uygulama ayarını kontrol et.',
    'apod.timeoutMsg': 'NASA APOD yanıtı çok uzun sürdü.',
    'apod.serverMsg': 'NASA APOD geçici olarak kullanılamıyor.',
    'apod.cooldownMsg': 'Kısa süre önce yenilendi. Gereksiz API isteğini önlemek için kayıtlı APOD korunuyor.',
    'apod.showingCached': 'Son kayıtlı APOD gösteriliyor.',
    'apod.showingArchive': 'Yerel gözlem arşivi gösteriliyor.',
  },
  de: {
    'apod.offlineMsg': 'NASA APOD konnte nicht erreicht werden. Verbindung prüfen und erneut versuchen.',
    'apod.rateLimitMsg': 'Das Anfrage-Limit für diesen NASA-API-Schlüssel wurde erreicht.',
    'apod.authMsg': 'NASA-APOD-API-Schlüssel wurde abgelehnt. App-Einstellungen prüfen.',
    'apod.timeoutMsg': 'NASA-APOD-Antwort hat zu lange gedauert.',
    'apod.serverMsg': 'NASA APOD ist vorübergehend nicht verfügbar.',
    'apod.cooldownMsg': 'Kürzlich aktualisiert. Gespeichertes APOD wird beibehalten, um API-Anfragen zu sparen.',
    'apod.showingCached': 'Zuletzt gespeichertes APOD wird angezeigt.',
    'apod.showingArchive': 'Lokales Beobachtungsarchiv wird angezeigt.',
  },
  fr: {
    'apod.offlineMsg': 'Impossible de joindre NASA APOD. Vérifiez votre connexion et réessayez.',
    'apod.rateLimitMsg': 'Limite de requêtes atteinte pour cette clé API NASA APOD.',
    'apod.authMsg': 'La clé API NASA APOD a été rejetée. Vérifiez la configuration.',
    'apod.timeoutMsg': 'Le serveur NASA APOD a mis trop de temps à répondre.',
    'apod.serverMsg': 'NASA APOD est temporairement indisponible.',
    'apod.cooldownMsg': 'Récemment actualisé. Image APOD enregistrée conservée pour limiter les requêtes.',
    'apod.showingCached': 'Affichage de la dernière image APOD enregistrée.',
    'apod.showingArchive': "Affichage de l'archive locale d'observation.",
  },
  es: {
    'apod.offlineMsg': 'No se pudo acceder a NASA APOD. Verifica tu conexión e inténtalo de nuevo.',
    'apod.rateLimitMsg': 'Se alcanzó el límite de solicitudes para esta clave de API de la NASA.',
    'apod.authMsg': 'La clave de API de NASA APOD fue rechazada. Revisa la configuración.',
    'apod.timeoutMsg': 'NASA APOD tardó demasiado en responder.',
    'apod.serverMsg': 'NASA APOD no está disponible temporalmente.',
    'apod.cooldownMsg': 'Actualizado recientemente. Conservando la imagen guardada para evitar peticiones innecesarias.',
    'apod.showingCached': 'Mostrando la última imagen APOD guardada.',
    'apod.showingArchive': 'Mostrando el archivo local de observación.',
  },
  ar: {
    'apod.offlineMsg': 'تعذر الوصول إلى NASA APOD. تحقق من اتصالك وحاول مجددًا.',
    'apod.rateLimitMsg': 'تم الوصول إلى الحد الأقصى لطلبات مفتاح NASA API هذا.',
    'apod.authMsg': 'تم رفض مفتاح NASA APOD API. تحقق من إعدادات التطبيق.',
    'apod.timeoutMsg': 'استغرقت استجابة NASA APOD وقتًا أطول من المتوقع.',
    'apod.serverMsg': 'خدمة NASA APOD غير متاحة مؤقتًا.',
    'apod.cooldownMsg': 'تم التحديث مؤخرًا. يتم الاحتفاظ بالصورة المحفوظة لتجنب الطلبات غير الضرورية.',
    'apod.showingCached': 'يتم عرض آخر صورة APOD محفوظة.',
    'apod.showingArchive': 'يتم عرض الأرشيف الفلكي المحلي.',
  },
  it: {
    'apod.offlineMsg': 'Impossibile raggiungere NASA APOD. Controlla la connessione e riprova.',
    'apod.rateLimitMsg': 'Limite di richieste raggiunto per questa chiave API della NASA.',
    'apod.authMsg': 'La chiave API NASA APOD è stata rifiutata. Controlla le impostazioni.',
    'apod.timeoutMsg': 'NASA APOD ha impiegato troppo tempo a rispondere.',
    'apod.serverMsg': 'NASA APOD è temporaneamente non disponibile.',
    'apod.cooldownMsg': 'Aggiornato di recente. Mantenimento dell’APOD salvato per evitare richieste non necessarie.',
    'apod.showingCached': 'Visualizzazione dell’ultimo APOD salvato.',
    'apod.showingArchive': 'Visualizzazione dell’archivio astronomico locale.',
  },
  pt: {
    'apod.offlineMsg': 'Não foi possível aceder ao NASA APOD. Verifique a ligação e tente novamente.',
    'apod.rateLimitMsg': 'O limite de pedidos para esta chave de API da NASA foi atingido.',
    'apod.authMsg': 'A chave de API do NASA APOD foi rejeitada. Verifique a configuração.',
    'apod.timeoutMsg': 'O NASA APOD demorou demasiado tempo a responder.',
    'apod.serverMsg': 'O NASA APOD está temporariamente indisponível.',
    'apod.cooldownMsg': 'Atualizado recentemente. A manter o APOD guardado para evitar pedidos desnecessários.',
    'apod.showingCached': 'A mostrar a última imagem APOD guardada.',
    'apod.showingArchive': 'A mostrar o arquivo local de observação.',
  },
};

// F1.3: startup GPS consent chip messages (kept flat like apodStatusMessages so the
// nested locale catalogs stay untouched).
const locationMessages: Partial<Record<LangCode, Record<string, string>>> = {
  en: {
    'location.gpsUpdatePrompt': 'Update the selected location from GPS?',
    'location.gpsUpdateConfirm': 'Update via GPS',
    'location.gpsUpdateDismiss': 'Keep manual location',
  },
  tr: {
    'location.gpsUpdatePrompt': 'Elle seçtiğin konum GPS ile güncellensin mi?',
    'location.gpsUpdateConfirm': 'GPS ile güncelle',
    'location.gpsUpdateDismiss': 'Elle seçilen kalsın',
  },
  de: {
    'location.gpsUpdatePrompt': 'Den gewählten Standort per GPS aktualisieren?',
    'location.gpsUpdateConfirm': 'Per GPS aktualisieren',
    'location.gpsUpdateDismiss': 'Manuellen Standort behalten',
  },
  fr: {
    'location.gpsUpdatePrompt': 'Mettre à jour le lieu choisi via GPS ?',
    'location.gpsUpdateConfirm': 'Mettre à jour via GPS',
    'location.gpsUpdateDismiss': 'Garder le lieu manuel',
  },
  es: {
    'location.gpsUpdatePrompt': '¿Actualizar la ubicación elegida con GPS?',
    'location.gpsUpdateConfirm': 'Actualizar con GPS',
    'location.gpsUpdateDismiss': 'Mantener ubicación manual',
  },
  ar: {
    'location.gpsUpdatePrompt': 'تحديث الموقع المحدد عبر GPS؟',
    'location.gpsUpdateConfirm': 'التحديث عبر GPS',
    'location.gpsUpdateDismiss': 'الاحتفاظ بالموقع اليدوي',
  },
  it: {
    'location.gpsUpdatePrompt': 'Aggiornare la posizione scelta tramite GPS?',
    'location.gpsUpdateConfirm': 'Aggiorna tramite GPS',
    'location.gpsUpdateDismiss': 'Mantieni posizione manuale',
  },
  pt: {
    'location.gpsUpdatePrompt': 'Atualizar a localização escolhida por GPS?',
    'location.gpsUpdateConfirm': 'Atualizar via GPS',
    'location.gpsUpdateDismiss': 'Manter localização manual',
  },
};

// F4.5: weather error channels (offline / timeout / server / unavailable), kept flat
// like apodStatusMessages and locationMessages so the nested locale catalogs stay
// untouched. Keys are resolved through t() with en fallback.
const weatherStatusMessages: Partial<Record<LangCode, Record<string, string>>> = {
  en: {
    'weather.offlineMsg': 'No internet connection. Weather data cannot be refreshed.',
    'weather.timeoutMsg': 'The weather service took too long to respond.',
    'weather.serverMsg': 'The weather service is temporarily unavailable.',
    'weather.unavailableMsg': 'Could not fetch weather data right now.',
  },
  tr: {
    'weather.offlineMsg': 'İnternet bağlantısı yok. Hava durumu yenilenemiyor.',
    'weather.timeoutMsg': 'Hava servisi zamanında yanıt vermedi.',
    'weather.serverMsg': 'Hava servisi şu anda erişilemiyor.',
    'weather.unavailableMsg': 'Hava durumu verisi şu anda alınamadı.',
  },
  de: {
    'weather.offlineMsg': 'Keine Internetverbindung. Wetterdaten können nicht aktualisiert werden.',
    'weather.timeoutMsg': 'Der Wetterdienst hat zu lange auf die Antwort gewartet.',
    'weather.serverMsg': 'Der Wetterdienst ist derzeit nicht erreichbar.',
    'weather.unavailableMsg': 'Wetterdaten konnten jetzt nicht abgerufen werden.',
  },
  fr: {
    'weather.offlineMsg': 'Pas de connexion Internet. Les données météo ne peuvent pas être actualisées.',
    'weather.timeoutMsg': 'Le service météo a mis trop de temps à répondre.',
    'weather.serverMsg': 'Le service météo est temporairement indisponible.',
    'weather.unavailableMsg': 'Impossible de récupérer les données météo pour le moment.',
  },
  es: {
    'weather.offlineMsg': 'Sin conexión a Internet. No se pueden actualizar los datos del tiempo.',
    'weather.timeoutMsg': 'El servicio del tiempo tardó demasiado en responder.',
    'weather.serverMsg': 'El servicio del tiempo no está disponible temporalmente.',
    'weather.unavailableMsg': 'No se pudieron obtener los datos del tiempo en este momento.',
  },
  ar: {
    'weather.offlineMsg': 'لا يوجد اتصال بالإنترنت. لا يمكن تحديث بيانات الطقس.',
    'weather.timeoutMsg': 'خدمة الطقس استغرقت وقتاً طويلاً في الرد.',
    'weather.serverMsg': 'خدمة الطقس غير متاحة مؤقتاً.',
    'weather.unavailableMsg': 'تعذر جلب بيانات الطقس الآن.',
  },
  it: {
    'weather.offlineMsg': 'Nessuna connessione Internet. I dati meteo non possono essere aggiornati.',
    'weather.timeoutMsg': 'Il servizio meteo ha impiegato troppo tempo a rispondere.',
    'weather.serverMsg': 'Il servizio meteo è temporaneamente non disponibile.',
    'weather.unavailableMsg': 'Impossibile recuperare i dati meteo in questo momento.',
  },
  pt: {
    'weather.offlineMsg': 'Sem ligação à Internet. Não é possível atualizar os dados do tempo.',
    'weather.timeoutMsg': 'O serviço meteorológico demorou demasiado a responder.',
    'weather.serverMsg': 'O serviço meteorológico está temporariamente indisponível.',
    'weather.unavailableMsg': 'Não foi possível obter os dados do tempo neste momento.',
  },
};

// F4.4: alarm timing/experience messages (web-only bell, quiet-hours postponed
// scheduling, next-year meteor preview), kept flat like the catalogs above so
// the nested locale catalogs stay untouched. Keys resolve through t() with en
// fallback.
const alarmTimingMessages: Partial<Record<LangCode, Record<string, string>>> = {
  en: {
    'alarm.webOnly': 'Notification alarms are only available in the mobile app. The bell sound is your local acknowledgment.',
    'alarm.queuedQuiet': 'Alarm scheduled — quiet hours postpone the notification a few hours.',
    'events.nextYearPreview': 'Next year preview',
  },
  tr: {
    'alarm.webOnly': 'Bildirim alarmları yalnızca mobil uygulamada kurulur. Çan sesi yerel geri bildirimdir.',
    'alarm.queuedQuiet': 'Alarm kuruldu — sessiz saatler bildirimi birkaç saat erteler.',
    'events.nextYearPreview': 'Gelecek yıl önizleme',
  },
  de: {
    'alarm.webOnly': 'Benachrichtigungsalarme gibt es nur in der Mobil-App. Der Glockenton ist Ihre lokale Bestätigung.',
    'alarm.queuedQuiet': 'Alarm gestellt — die Ruhezeiten verschieben die Benachrichtigung um einige Stunden.',
    'events.nextYearPreview': 'Vorschau für das nächste Jahr',
  },
  fr: {
    'alarm.webOnly': 'Les rappels par notification ne sont disponibles que dans l\'application mobile. La sonnerie sert d\'accusé local.',
    'alarm.queuedQuiet': 'Alarme programmée — les heures calmes repoussent la notification de quelques heures.',
    'events.nextYearPreview': 'Aperçu de l\'année prochaine',
  },
  es: {
    'alarm.webOnly': 'Las alarmas por notificación solo están disponibles en la app móvil. El sonido de campana es tu confirmación local.',
    'alarm.queuedQuiet': 'Alarma programada — las horas de silencio posponen la notificación unas horas.',
    'events.nextYearPreview': 'Vista previa del año que viene',
  },
  ar: {
    'alarm.webOnly': 'تنبيهات الإشعارات متاحة في تطبيق الهاتف فقط. صوت الجرس هو تأكيد محلي.',
    'alarm.queuedQuiet': 'تم ضبط التنبيه — الساعات الهادئة تؤجل الإشعار بضع ساعات.',
    'events.nextYearPreview': 'معاينة العام القادم',
  },
  it: {
    'alarm.webOnly': 'Le sveglie da notifica sono disponibili solo nell\'app mobile. Il suono di campana è la conferma locale.',
    'alarm.queuedQuiet': 'Sveglia impostata — le ore silenziose posticipano la notifica di alcune ore.',
    'events.nextYearPreview': 'Anteprima dell\'anno prossimo',
  },
  pt: {
    'alarm.webOnly': 'Alarmes por notificação só estão disponíveis na app móvel. O som de sino é a confirmação local.',
    'alarm.queuedQuiet': 'Alarme definido — as horas silenciosas adiam a notificação algumas horas.',
    'events.nextYearPreview': 'Pré-visualização do próximo ano',
  },
};

const lookup = (catalog: TranslationMap | undefined, keys: string[]): string | null => {
  let current: TranslationNode | undefined = catalog;
  for (const key of keys) {
    if (!isTranslationMap(current)) return null;
    const actualKey: string | undefined = Object.keys(current).find(candidate => candidate.toLowerCase() === key.toLowerCase());
    if (!actualKey) return null;
    current = current[actualKey];
  }
  return typeof current === 'string' ? current : null;
};

export const t = (key: string, lang: LangCode): string => {
  const extraMessage = extraTranslations[lang]?.[key] || extraTranslations.en[key];
  if (extraMessage) return extraMessage;
  const apodStatusMessage = apodStatusMessages[lang]?.[key] || apodStatusMessages.en?.[key];
  if (apodStatusMessage) return apodStatusMessage;
  const locationMessage = locationMessages[lang]?.[key] || locationMessages.en?.[key];
  if (locationMessage) return locationMessage;
  const weatherStatusMessage = weatherStatusMessages[lang]?.[key] || weatherStatusMessages.en?.[key];
  if (weatherStatusMessage) return weatherStatusMessage;
  const alarmTimingMessage = alarmTimingMessages[lang]?.[key] || alarmTimingMessages.en?.[key];
  if (alarmTimingMessage) return alarmTimingMessage;
  const keys = key.split('.');
  return lookup(translations[lang], keys) ?? lookup(translations.en, keys) ?? key;
};

export const getStatusText = (status: SuitabilityStatus, lang: LangCode): string => {
  const keys: Record<SuitabilityStatus, string> = {
    excellent: 'obs.statusExcellent',
    good: 'obs.statusGood',
    fair: 'obs.statusFair',
    poor: 'obs.statusPoor',
    unsuitable: 'obs.statusUnsuitable',
  };
  return t(keys[status], lang);
};
