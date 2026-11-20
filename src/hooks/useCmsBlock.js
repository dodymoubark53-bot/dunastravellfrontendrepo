import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { supportedLocale } from '../utils/locale';
import { fetchWithSmartCache, getCachedEntry, abortQuery, CACHE_POLICIES } from '../utils/apiCache';

const CMS_LOCALES = ['en', 'ar', 'es', 'pt', 'it'];

export function deepLocalizeCms(data, lang) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => deepLocalizeCms(item, lang));
  }
  const keys = Object.keys(data);
  const isLocaleObject = keys.length > 0 && keys.every((k) => CMS_LOCALES.includes(k));
  if (isLocaleObject) {
    const cleanLang = String(lang || 'en').split('-')[0].toLowerCase();
    return data[cleanLang] ?? data.en ?? data.ar ?? data.es ?? data.pt ?? data.it ?? Object.values(data)[0] ?? '';
  }
  const result = {};
  for (const [k, v] of Object.entries(data)) {
    result[k] = deepLocalizeCms(v, lang);
  }
  return result;
}

export function useCmsBlock(key) {
  const { i18n } = useTranslation();
  const lang = supportedLocale(i18n.language);
  const queryKey = key ? ['cms', key, lang] : null;

  const cached = queryKey ? getCachedEntry(queryKey) : null;
  const [data, setData] = useState(cached ? deepLocalizeCms(cached.data, lang) : null);
  const [loading, setLoading] = useState(queryKey ? !cached : false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!key || !queryKey) return;
    
    const fetchBlock = async () => {
      try {
        const currentCached = getCachedEntry(queryKey);
        if (!currentCached) {
          setLoading(true);
        }
        setError(null);

        const res = await fetchWithSmartCache(
          queryKey,
          async ({ signal } = {}) => {
            const response = await api.get(`/cms/${encodeURIComponent(key)}?lang=${lang}`, { signal });
            return response?.content || response;
          },
          CACHE_POLICIES.STATIC_CONFIG
        );

        if (isMounted && res) {
          setData(deepLocalizeCms(res, lang));
        }
      } catch (err) {
        if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return;
        if (isMounted) {
          setError(err);
          console.warn(`[CMS] Failed to fetch block '${key}'.`, err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBlock();

    return () => {
      isMounted = false;
      abortQuery(queryKey);
    };
  }, [key, lang]);

  return { block: data, data, loading, error };
}
