import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import TourDetailsView from '../../components/tour/TourDetailsView';
import { services } from '../../data/services';

const ALIAS_MAP = {
  'extension-hurghada': 'hurghada-4d3n',
  'extension-sharm': 'sharm-4d3n',
  'extension-siwa': 'siwa-oasis-alexandria',
  'hurghada': 'hurghada-4d3n',
  'sharm': 'sharm-4d3n',
  'siwa': 'siwa-oasis-alexandria',
};

const DEFAULT_SLUG = 'hurghada-4d3n';

const EXTENSION_META = {
  'hurghada-4d3n': {
    durationKey: 'trip.hurghada.duration',
    durationDefault: '04 Days / 03 Nights',
    minPax: '2 Pax',
    inclusionsTitle: 'trip.hurghada.includes.title',
    exclusionsTitle: 'trip.hurghada.excludes.title',
  },
  'sharm-4d3n': {
    durationKey: 'trip.sharm.duration',
    durationDefault: '04 Days / 03 Nights',
    minPax: '2 Pax',
    inclusionsTitle: 'trip.sharm.includes.title',
    exclusionsTitle: 'trip.sharm.excludes.title',
  },
  'siwa-oasis-alexandria': {
    durationKey: 'tour_siwa_duration',
    durationDefault: '05 Days / 04 Nights',
    minPax: '2 Pax',
    inclusionsTitle: 'tour_siwa_includes_title',
    exclusionsTitle: 'tourDetails.excludes',
  },
};

/**
 * Builds a tour object shaped exactly like the ones produced by `useTour`
 * (normalizeTour) from the static Egypt extension add-ons, so the shared
 * `TourDetailsView` renders these three trips with the same design as every
 * other trip on the site.
 */
function buildExtensionTour(base, meta, t) {
  const images = Array.isArray(base.images) ? base.images.filter(Boolean) : [];
  const overview = (Array.isArray(base.overview) ? base.overview : [])
    .map((key) => (typeof key === 'string' ? t(key, key) : key))
    .filter(Boolean)
    .join(' ');

  return {
    id: base.id,
    slug: base.slug,
    type: 'extension',
    category: 'extension',
    destination: 'egypt',
    country: 'Egypt',
    title: base.title,
    overview,
    duration: t(meta.durationKey, meta.durationDefault),
    durationDays: Array.isArray(base.itinerary) ? base.itinerary.length : 0,
    minPax: meta.minPax,
    images,
    heroImage: images[0] || null,
    rating: base.rating || 5,
    highlights: Array.isArray(base.highlights) ? base.highlights : [],
    included: Array.isArray(base.included) ? base.included : [],
    excluded: Array.isArray(base.excluded) ? base.excluded : [],
    inclusionsTitle: meta.inclusionsTitle,
    exclusionsTitle: base.excluded && base.excluded.length > 0 ? meta.exclusionsTitle : null,
    itinerary: (Array.isArray(base.itinerary) ? base.itinerary : []).map((day) => ({
      ...day,
      description: day.description || day.body || '',
    })),
    // Extensions are add-ons quoted on request, so no online numeric price.
    price: 0,
    basePriceUsd: 0,
    currency: 'USD',
    priceDisplayMode: 'HIDDEN',
    bookingRules: null,
    accommodations: [],
    seasonRules: [],
    notes: [],
    excursions: [],
  };
}

export default function ExtensionDetails() {
  const { t } = useTranslation();
  const params = useParams();
  const rawParam = params.id || params.slug || params.programId || params['*'] || '';
  const targetSlug = ALIAS_MAP[rawParam] || rawParam;

  const tour = useMemo(() => {
    const base = services.find((s) => s.slug === targetSlug)
      || services.find((s) => s.slug === DEFAULT_SLUG);
    const meta = EXTENSION_META[base.slug] || EXTENSION_META[DEFAULT_SLUG];
    return buildExtensionTour(base, meta, t);
  }, [targetSlug, t]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tour.slug]);

  return <TourDetailsView tour={tour} />;
}
