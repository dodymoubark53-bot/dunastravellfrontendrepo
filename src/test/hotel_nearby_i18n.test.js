import { describe, it, expect } from 'vitest';
import en from '../i18n/locales/en.json';
import ar from '../i18n/locales/ar.json';
import es from '../i18n/locales/es.json';
import itLocale from '../i18n/locales/it.json';
import pt from '../i18n/locales/pt.json';

const locales = { en, ar, es, it: itLocale, pt };

// Every label rendered by the "What's Nearby" section on hotel details
// (hotel.nearby.* keys used in src/pages/hotels/HotelDetails.jsx).
const NEARBY_KEY_PREFIX = 'hotel.nearby.';

describe('hotel nearby labels i18n', () => {
  const keys = Object.keys(en).filter((key) => key.startsWith(NEARBY_KEY_PREFIX));

  it('exposes all nearby attraction, dining, landmark, unit and section labels', () => {
    expect(keys.length).toBeGreaterThanOrEqual(29);
    expect(keys).toEqual(
      expect.arrayContaining([
        'hotel.nearby.title',
        'hotel.nearby.attractions',
        'hotel.nearby.dining',
        'hotel.nearby.landmarks',
        'hotel.nearby.cafeBar',
        'hotel.nearby.km',
        'hotel.nearby.m',
        'hotel.nearby.copticMuseum',
        'hotel.nearby.saladinCitadel',
        'hotel.nearby.lobbyBar',
        'hotel.nearby.octoberPanorama',
      ])
    );
  });

  it('has a non-empty translation for every label in all five languages', () => {
    for (const [lang, dictionary] of Object.entries(locales)) {
      for (const key of keys) {
        expect(typeof dictionary[key], `${lang} is missing a string for ${key}`).toBe('string');
        expect(
          String(dictionary[key]).trim().length,
          `${lang} has an empty translation for ${key}`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('keeps Arabic labels translated rather than copied from English', () => {
    const arabicKeys = keys.filter((key) => key !== 'hotel.nearby.km' && key !== 'hotel.nearby.m');
    for (const key of arabicKeys) {
      expect(ar[key], `hotel.nearby.* key ${key} still holds the English label`).not.toBe(en[key]);
    }
  });
});
