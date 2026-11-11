import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const supportedLngs = ['en', 'ar', 'es', 'pt', 'it'];

const toTitleCase = (value) => {
  if (typeof value !== 'string' || !value) return value;
  if (/[\u0600-\u06FF]/.test(value)) return value;
  if (value.startsWith('http://') || value.startsWith('https://') || (value.includes('@') && !value.includes(' '))) {
    return value;
  }
  let clean = value.replace(/^data\./i, '');

  if (clean.includes('<') && clean.includes('>')) {
    return clean.replace(/(^|>)([^<]+)(?=<|$)/g, (_, prefix, content) => {
      const capitalized = content.replace(/\b([a-zA-Z\u00C0-\u024F])([a-zA-Z\u00C0-\u024F]*)/g, (m, first, rest) => {
        if (m === m.toUpperCase() && m.length <= 3) return m;
        return first.toUpperCase() + rest.toLowerCase();
      });
      return prefix + capitalized;
    });
  }
  return clean.replace(/\b([a-zA-Z\u00C0-\u024F])([a-zA-Z\u00C0-\u024F]*)/g, (m, first, rest) => {
    if (m === m.toUpperCase() && m.length <= 3) return m;
    return first.toUpperCase() + rest.toLowerCase();
  });
};

const transformObjToTitleCase = (obj) => {
  if (!obj) return obj;
  if (typeof obj === 'string') return toTitleCase(obj);
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'string' ? toTitleCase(item) : transformObjToTitleCase(item));
  }
  if (typeof obj === 'object') {
    const res = {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string') {
        res[k] = toTitleCase(v);
      } else if (typeof v === 'object' && v !== null) {
        res[k] = transformObjToTitleCase(v);
      } else {
        res[k] = v;
      }
    }
    return res;
  }
  return obj;
};

const loadLocaleResource = async (lng) => {
  switch (lng) {
    case 'ar': return (await import('./locales/ar.json')).default;
    case 'es': return (await import('./locales/es.json')).default;
    case 'it': return (await import('./locales/it.json')).default;
    case 'pt': return (await import('./locales/pt.json')).default;
    case 'en': default: return (await import('./locales/en.json')).default;
  }
};

const normalizeLng = (lng) => {
  const lang = String(lng || 'en').split('-')[0].toLowerCase();
  return supportedLngs.includes(lang) ? lang : 'en';
};

const pendingLocaleLoads = new Map();

/**
 * Makes sure exactly one language file is in memory. Each file lives in its
 * own Vite chunk (locale-ar, locale-en, ...), so this import is a network
 * request the first time a language is used and a no-op afterwards.
 */
export const ensureLocaleLoaded = async (lng) => {
  const lang = normalizeLng(lng);
  if (i18n.hasResourceBundle(lang, 'translation')) return lang;

  if (!pendingLocaleLoads.has(lang)) {
    const promise = loadLocaleResource(lang)
      .then((data) => {
        if (!i18n.hasResourceBundle(lang, 'translation')) {
          i18n.addResourceBundle(lang, 'translation', data, true, true);
        }
        return lang;
      })
      .finally(() => pendingLocaleLoads.delete(lang));
    pendingLocaleLoads.set(lang, promise);
  }

  return pendingLocaleLoads.get(lang);
};

/**
 * Preloads a language only when the visitor shows intent (hover/focus on the
 * language switcher). Never called during page load for non-active languages.
 */
export const preloadLocale = (lng) => ensureLocaleLoaded(lng).catch(() => {});

/**
 * Loads the requested locale first, then switches the UI. This removes the
 * window where the new language is active but its translations are still in
 * flight (which used to flash raw keys / English text).
 */
export const changeAppLanguage = async (lng) => {
  const lang = normalizeLng(lng);
  try {
    await ensureLocaleLoaded(lang);
  } catch (error) {
    console.warn(`Locale "${lang}" failed to load, keeping current language:`, error);
    return i18n.language;
  }

  await i18n.changeLanguage(lang);

  try {
    localStorage.setItem('i18nextLng', lang);
  } catch {
    // Ignore storage restrictions; the in-memory language still switches.
  }

  syncDocumentDirection(lang);
  return lang;
};

const getDefaultLng = () => {
  // 1) Explicit URL preference (?lang=ar or /?lng=ar) wins over everything so
  //    shared links always open in the language they were created with.
  try {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = (params.get('lang') || params.get('lng') || '').split('-')[0].toLowerCase();
      if (supportedLngs.includes(fromUrl)) return fromUrl;
    }
  } catch {
    // ignore
  }

  // 2) Saved preference
  try {
    const stored = localStorage.getItem('i18nextLng');
    if (stored) {
      const lang = stored.split('-')[0];
      if (supportedLngs.includes(lang)) return lang;
    }
  } catch {
    // ignore
  }

  // 3) Browser language, 4) English default
  const navLng = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
  return supportedLngs.includes(navLng) ? navLng : 'en';
};

export const syncDocumentDirection = (lng) => {
  if (typeof document === 'undefined') return;
  const isAr = lng && (lng === 'ar' || lng.startsWith('ar'));
  const dir = isAr ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng || 'en';
  if (document.body) {
    document.body.dir = dir;
    if (isAr) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }
};



const pascalCasePostProcessor = {
  type: 'postProcessor',
  name: 'pascalCaseProcessor',
  process(value) {
    const currentLng = i18n.language || 'en';
    if (currentLng === 'ar' || currentLng.startsWith('ar')) return value;
    return toTitleCase(value);
  }
};

i18n.use(pascalCasePostProcessor).use(LanguageDetector).use(initReactI18next);

// Polyfill for i18n.dir() — removed in i18next v26+.
// Attached immediately (not only after async init) so components that render
// before initI18n() resolves don't crash with "i18n.dir is not a function".
if (typeof i18n.dir !== 'function') {
  i18n.dir = () => {
    const lng = (typeof i18n.language === 'string' && i18n.language) || i18n.languages?.[0] || getDefaultLng();
    return lng === 'ar' || lng.startsWith('ar') ? 'rtl' : 'ltr';
  };
}

let initPromise = null;

export const initI18n = async () => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const lng = getDefaultLng();
      const initialData = await loadLocaleResource(lng);
      
      const resources = {
        [lng]: { translation: initialData }
      };

      await i18n.init({
        resources,
        fallbackLng: 'en',
        lng,
        interpolation: { escapeValue: false },
        keySeparator: false,
        postProcess: ['pascalCaseProcessor'],
      });

      // Polyfill for i18n.dir() — removed in i18next v26+.
      // Many components still call i18n.dir() to detect RTL. Restore it here
      // so all existing usages keep working without editing every file.
      if (typeof i18n.dir !== 'function') {
        i18n.dir = () => {
          const lng = i18n.language || i18n.languages?.[0] || 'en';
          return lng === 'ar' || lng.startsWith('ar') ? 'rtl' : 'ltr';
        };
      }

      syncDocumentDirection(lng);

      // Load locales lazily on-demand when switched

      i18n.on('languageChanged', async (newLng) => {
        syncDocumentDirection(newLng);
        const lang = newLng.split('-')[0];
        if (supportedLngs.includes(lang)) {
          if (!i18n.hasResourceBundle(lang, 'translation')) {
            const data = await loadLocaleResource(lang);
            i18n.addResourceBundle(lang, 'translation', data, true, true);
          }
          // Notify react-i18next to force re-render components with newly loaded translations
          i18n.emit('loaded');
        }
      });
    } catch (err) {
      console.warn('initI18n fallback triggered:', err);
    }
  })();
  return initPromise;
};

export default i18n;


