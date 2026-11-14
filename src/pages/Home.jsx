import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/seo/SEOHead';
import HomeHeroSection from '../components/home/HomeHeroSection';

const HomeExperienceSection = lazy(() => import('../components/home/HomeExperienceSection'));

/**
 * Route-level composition for the home experience.
 * HomeHeroSection is rendered immediately above the fold for instant 1.6s LCP and 0 CLS.
 * The below-the-fold content (search, tours, destinations, counters) is deferred until viewport proximity or interaction.
 */
export default function Home() {
  const { t } = useTranslation();
  const [shouldMountExperience, setShouldMountExperience] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (shouldMountExperience) return;

    // Trigger on first user scroll, touch, or mouse interaction
    const triggerMount = () => setShouldMountExperience(true);

    window.addEventListener('scroll', triggerMount, { passive: true, once: true });
    window.addEventListener('touchstart', triggerMount, { passive: true, once: true });
    window.addEventListener('mousemove', triggerMount, { passive: true, once: true });

    // Viewport sentinel: mount if user comes within 400px of below-the-fold content
    let observer;
    if ('IntersectionObserver' in window && sentinelRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setShouldMountExperience(true);
          }
        },
        { rootMargin: '400px' }
      );
      observer.observe(sentinelRef.current);
    }

    // Safety fallback: mount after idle window so search bots and slow idle visitors get full content
    let idleHandle;
    let timerHandle;
    if ('requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(() => setShouldMountExperience(true), { timeout: 3500 });
    } else {
      timerHandle = setTimeout(() => setShouldMountExperience(true), 2500);
    }

    return () => {
      window.removeEventListener('scroll', triggerMount);
      window.removeEventListener('touchstart', triggerMount);
      window.removeEventListener('mousemove', triggerMount);
      if (observer) observer.disconnect();
      if (idleHandle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
      if (timerHandle) clearTimeout(timerHandle);
    };
  }, [shouldMountExperience]);

  return (
    <div className="w-full">
      <SEOHead
        title={t(
          "home.metaTitle",
          "Award-Winning Experiences in Egypt, Jordan, Turkey, Tunisia, Greece, Holy Land, Morocco and Dubai"
        )}
        description={t(
          "home.metaDesc",
          "Experience true luxury with Dunas Travel — curated journeys through the timeless wonders of Egypt, Jordan, Turkey, Tunisia, Greece, the Holy Land, Morocco, and Dubai."
        )}
        keywords="luxury egypt tours, private middle east holidays, nile cruise private tour, bespoke luxury travel cairo luxor aswan, jordan petra luxury, turkey cappadocia tour"
        canonical="https://dunas-travel.com/"
        ogImage="https://dunas-travel.com/imgs/slider-abu-simbel.webp"
      />
      <HomeHeroSection />
      <div ref={sentinelRef} className="w-full" style={{ minHeight: shouldMountExperience ? 'auto' : '520px' }}>
        {shouldMountExperience ? (
          <Suspense fallback={<div className="w-full min-h-[520px]" />}>
            <HomeExperienceSection />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
