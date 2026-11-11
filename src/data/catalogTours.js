/**
 * Lazy access to the bundled tour catalogue.
 *
 * The catalogue is a ~2.4 MB JSON file. It used to be imported statically by
 * the Home page, which put its whole payload (and the JS needed to parse it)
 * into the entry chunk. Importing it with `?url` makes Vite emit it as a plain
 * asset instead, and we fetch/parse it only when the page asks for it (after
 * first paint / when the tour sections get close to the viewport).
 *
 * The parsed result is cached for the lifetime of the page so language
 * switches or re-mounts never download it twice.
 */
import catalogUrl from './database/unified_52_tours.json?url';

let cachedTours = null;
let inflight = null;

export const getCachedCatalogTours = () => cachedTours;

export const loadCatalogTours = () => {
  if (cachedTours) return Promise.resolve(cachedTours);
  if (inflight) return inflight;

  inflight = fetch(catalogUrl, { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load tour catalogue (${response.status})`);
      return response.json();
    })
    .then((data) => {
      const tours = Array.isArray(data?.tours) ? data.tours : [];
      cachedTours = tours;
      return tours;
    })
    .catch((error) => {
      // Keep the app usable: live API/destination tours still render.
      console.warn('Tour catalogue could not be loaded:', error);
      cachedTours = [];
      return cachedTours;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
};

export default loadCatalogTours;
