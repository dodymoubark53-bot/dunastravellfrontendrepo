import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { supportedLocale } from '../utils/locale';
import {
  fetchWithSmartCache,
  getCachedEntry,
  abortQuery,
  CACHE_POLICIES,
} from '../utils/apiCache';

export const HERO_WIDGETS_BLOCK_KEY = 'hero_widgets';

/**
 * Reads the dashboard-managed hero widget block.
 *
 * The public CMS endpoint already unwraps the requested locale (the block is
 * stored as `{ en: {...}, ar: {...} }`), so the result is the locale document
 * `{ pages: { '/some/path': { badge, highlights, ... } } }`.
 *
 * The block is optional: until an admin saves it from the dashboard we simply
 * return `null` and the hero keeps its original hardcoded content.
 */
export function useHeroWidgets() {
  const { i18n } = useTranslation();
  const lang = supportedLocale(
    i18n?.language || (typeof document !== 'undefined' ? document.documentElement.lang : '') || 'ar'
  );
  const queryKey = useMemo(
    () => ['cms', HERO_WIDGETS_BLOCK_KEY, lang],
    [lang]
  );

  const cached = getCachedEntry(queryKey);
  const [data, setData] = useState(cached ? cached.data : null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const result = await fetchWithSmartCache(
          queryKey,
          async ({ signal } = {}) => {
            const response = await api.get(
              `/cms/${HERO_WIDGETS_BLOCK_KEY}?lang=${lang}`,
              { signal }
            );
            return response?.content ?? response;
          },
          CACHE_POLICIES.HERO_CONFIG
        );
        if (isMounted) setData(result || null);
      } catch {
        // 404 (block not created yet) / offline: keep the built-in hero copy.
        if (isMounted) setData(null);
      }
    };

    load();
    return () => {
      isMounted = false;
      abortQuery(queryKey);
    };
  }, [lang, queryKey]);

  return data;
}
