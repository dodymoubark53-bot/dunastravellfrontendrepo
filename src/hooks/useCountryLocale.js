import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureCountryLocale } from '../utils/countries';

/**
 * Loads the country-name locale for the active language only.
 *
 * `i18n-iso-countries` needs a locale JSON per language. Registering them all
 * up front bundled ~33 KB of unused data into the phone-input chunk, so the
 * active locale is fetched on demand here. The hook forces one re-render when
 * the locale arrives so country labels switch from the English fallback to the
 * localized names without any extra state in the consuming component.
 */
export default function useCountryLocale(languageOverride) {
  const { i18n } = useTranslation();
  const language = languageOverride || i18n?.language || 'en';
  const languageKey = String(language).split('-')[0].toLowerCase();
  const [, setLoadedKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    ensureCountryLocale(languageKey).then((loadedKey) => {
      if (!cancelled && loadedKey) setLoadedKey(loadedKey);
    });
    return () => {
      cancelled = true;
    };
  }, [languageKey]);

  return languageKey;
}
