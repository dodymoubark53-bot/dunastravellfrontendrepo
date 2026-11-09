import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTour } from '../../hooks/useTour';
import { trackEvent } from '../../utils/analytics';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import ErrorState from '../../components/ui/ErrorState';
import TourDetailsView from '../../components/tour/TourDetailsView';

const TourDetails = () => {
  const { t } = useTranslation();
  const params = useParams();
  const rawSlug = params.slug || params.programSlug || params['*'] || params.programId || params.id;
  const trimmedSlug = rawSlug ? String(rawSlug).trim() : '';
  // NOTE: `classic-program` is a real, published tour (slug "classic-program") in the backend.
  // It must resolve to itself; only a genuinely missing slug falls back to a default tour.
  const slug = !trimmedSlug ? 'complete-egypt-8d' : trimmedSlug;

  const { tour, loading, error } = useTour(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (tour?.slug) {
      trackEvent('tour_view', { tourSlug: tour.slug });
    }
  }, [tour?.slug]);

  if (loading) {
    return (
      <div className="w-full bg-obsidian-50 dark:bg-[#0f0f1a] min-h-screen pt-32 px-6 container mx-auto">
        <SkeletonLoader count={1} type="card" />
      </div>
    );
  }

  if (error || !tour) {
    const errorMessage = typeof error === 'object' && error !== null
      ? (error.message || String(error))
      : (error || t('tour.notFoundDesc', 'We could not find the requested luxury tour.'));

    return (
      <div className="w-full bg-obsidian-50 dark:bg-[#0f0f1a] min-h-screen pt-32 px-6 container mx-auto">
        <ErrorState
          title={t('common.errorOccurred', 'Tour not found')}
          message={errorMessage}
          actionLabel={t('tour.browseAll', 'Browse Tours')}
          actionLink="/tours"
        />
      </div>
    );
  }

  return <TourDetailsView tour={tour} />;
};

export default TourDetails;
